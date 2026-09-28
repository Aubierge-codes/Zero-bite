"""
Field Teams Router
Field teams, assignments and breeding-site treatment logs.
Treatment logs feed the dashboards (sites treated, larvae reduction) and reports.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, require_coordinator
from data_pipeline.rwanda_districts import DISTRICT_INFO, canonical_district
from database.models import ActivityLog, FieldTeam, RiskZone, TeamAssignment, TreatmentRecord, User
from database.session import get_db
from field_teams.schemas import AssignmentCreate, TeamCreate, TeamStatusUpdate, TreatmentRecordCreate

router = APIRouter()


def _team_dict(t: FieldTeam) -> dict:
    return {"id": str(t.id), "name": t.name, "leader_name": t.leader_name, "leader_phone": t.leader_phone,
            "district": t.district, "team_size": t.team_size, "status": t.status,
            "specialization": t.specialization}


def _district_or_422(name: str) -> str:
    district = canonical_district(name)
    if not district:
        raise HTTPException(status_code=422, detail=f"Unknown district '{name}'")
    return district


@router.get("/")
async def list_teams(status: Optional[str] = None, district: Optional[str] = None,
                     db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(FieldTeam).order_by(FieldTeam.name)
    if status:
        stmt = stmt.where(FieldTeam.status == status)
    if district:
        stmt = stmt.where(FieldTeam.district == _district_or_422(district))
    return [_team_dict(t) for t in (await db.execute(stmt)).scalars().all()]


@router.post("/")
async def create_team(payload: TeamCreate, db: AsyncSession = Depends(get_db),
                      current_user: User = Depends(require_coordinator)):
    team = FieldTeam(
        name=payload.name.strip(), leader_name=payload.leader_name.strip(), leader_phone=payload.leader_phone,
        district=_district_or_422(payload.district), team_size=payload.team_size,
        specialization=payload.specialization,
    )
    db.add(team)
    db.add(ActivityLog(event_type="team_created",
                       description=f"{current_user.email} created field team {team.name} ({team.district})"))
    await db.commit()
    return {"message": "Team created", "id": str(team.id), "team": _team_dict(team)}


@router.patch("/{team_id}/status")
async def set_team_status(team_id: str, payload: TeamStatusUpdate, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(require_coordinator)):
    team = await db.get(FieldTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.status = payload.status
    await db.commit()
    return _team_dict(team)


@router.post("/{team_id}/assign")
async def assign_team(team_id: str, payload: AssignmentCreate, db: AsyncSession = Depends(get_db),
                      current_user: User = Depends(require_coordinator)):
    team = await db.get(FieldTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not await db.get(RiskZone, payload.zone_id):
        raise HTTPException(status_code=404, detail="Zone not found")

    assignment = TeamAssignment(
        team_id=team_id, zone_id=payload.zone_id, assigned_by=current_user.id,
        task_type=payload.task_type, priority=payload.priority, notes=payload.notes,
    )
    db.add(assignment)
    team.status = "deployed"
    await db.commit()
    return {"message": f"Team {team.name} assigned to zone {payload.zone_id}", "assignment_id": str(assignment.id)}


# ── Treatment logs ─────────────────────────────────────────────────────────────

async def _create_treatment(payload: TreatmentRecordCreate, db: AsyncSession, user: User) -> dict:
    district = _district_or_422(payload.district)
    if payload.team_id and not await db.get(FieldTeam, payload.team_id):
        raise HTTPException(status_code=404, detail="Team not found")
    if (payload.larvae_count_before is not None and payload.larvae_count_after is not None
            and payload.larvae_count_after > payload.larvae_count_before * 10 + 100):
        raise HTTPException(status_code=422, detail="Larvae count after treatment looks wrong — please check it")

    zone = (await db.execute(
        select(RiskZone).where(RiskZone.district == district).limit(1)
    )).scalar_one_or_none()
    info = DISTRICT_INFO[district]
    record = TreatmentRecord(
        team_id=payload.team_id, zone_id=zone.id if zone else None, district=district,
        latitude=payload.latitude if payload.latitude is not None else info["latitude"],
        longitude=payload.longitude if payload.longitude is not None else info["longitude"],
        larvicide_ml_used=payload.larvicide_ml_used, site_type=payload.site_type.strip(),
        larvae_count_before=payload.larvae_count_before, larvae_count_after=payload.larvae_count_after,
        notes=payload.notes, treated_at=datetime.utcnow(), logged_by=user.id,
    )
    db.add(record)
    db.add(ActivityLog(event_type="treatment_logged",
                       description=f"{user.full_name} logged a {record.site_type} treatment in {district}"))
    await db.commit()
    return {"message": "Treatment logged", "id": str(record.id)}


@router.post("/treatments")
async def log_treatment(payload: TreatmentRecordCreate, db: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    """Log a treated breeding site (any signed-in field user)."""
    return await _create_treatment(payload, db, current_user)


@router.post("/{team_id}/treatment-log")
async def log_team_treatment(team_id: str, payload: TreatmentRecordCreate, db: AsyncSession = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    """Backwards-compatible route: log a treatment for a specific team."""
    payload.team_id = team_id
    return await _create_treatment(payload, db, current_user)


@router.get("/treatments")
async def list_treatments(district: Optional[str] = None, days: int = 30, limit: int = 50,
                          db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    cutoff = datetime.utcnow() - timedelta(days=max(1, min(days, 365)))
    stmt = (select(TreatmentRecord, User.full_name)
            .join(User, User.id == TreatmentRecord.logged_by, isouter=True)
            .where(TreatmentRecord.treated_at >= cutoff)
            .order_by(TreatmentRecord.treated_at.desc())
            .limit(max(1, min(limit, 200))))
    if district:
        stmt = stmt.where(TreatmentRecord.district == _district_or_422(district))
    rows = (await db.execute(stmt)).all()
    return [
        {
            "id": str(r.id), "district": r.district, "team_id": r.team_id, "site_type": r.site_type,
            "larvicide_ml_used": r.larvicide_ml_used, "larvae_count_before": r.larvae_count_before,
            "larvae_count_after": r.larvae_count_after, "latitude": r.latitude, "longitude": r.longitude,
            "notes": r.notes, "treated_at": r.treated_at, "logged_by": name,
        }
        for r, name in rows
    ]
