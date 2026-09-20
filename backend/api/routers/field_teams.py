from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from database.session import get_db
from database.models import FieldTeam, TreatmentRecord, TeamAssignment
from field_teams.schemas import TeamCreate, AssignmentCreate, TreatmentRecordCreate

router = APIRouter()


@router.get("/")
async def list_teams(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(FieldTeam)
    if status:
        stmt = stmt.where(FieldTeam.status == status)
    result = await db.execute(stmt)
    teams = result.scalars().all()
    return [{"id": str(t.id), "name": t.name, "leader_name": t.leader_name,
             "district": t.district, "team_size": t.team_size,
             "status": t.status, "specialization": t.specialization} for t in teams]


@router.post("/")
async def create_team(payload: TeamCreate, db: AsyncSession = Depends(get_db)):
    team = FieldTeam(
        name=payload.name, leader_name=payload.leader_name, leader_phone=payload.leader_phone,
        district=payload.district, team_size=payload.team_size, specialization=payload.specialization,
    )
    db.add(team)
    await db.commit()
    return {"message": "Team created", "id": str(team.id)}


@router.post("/{team_id}/assign")
async def assign_team(team_id: str, payload: AssignmentCreate, db: AsyncSession = Depends(get_db)):
    team = await db.get(FieldTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    assignment = TeamAssignment(
        team_id=team_id, zone_id=payload.zone_id,
        task_type=payload.task_type, priority=payload.priority, notes=payload.notes,
    )
    db.add(assignment)
    team.status = "deployed"
    await db.commit()
    return {"message": f"Team {team.name} assigned to zone {payload.zone_id}", "assignment_id": str(assignment.id)}


@router.post("/{team_id}/treatment-log")
async def log_treatment(team_id: str, payload: TreatmentRecordCreate, db: AsyncSession = Depends(get_db)):
    record = TreatmentRecord(
        team_id=team_id, zone_id=payload.zone_id, latitude=payload.latitude, longitude=payload.longitude,
        larvicide_ml_used=payload.larvicide_ml_used, site_type=payload.site_type,
        larvae_count_before=payload.larvae_count_before, larvae_count_after=payload.larvae_count_after,
        notes=payload.notes, treated_at=datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    return {"message": "Treatment logged", "id": str(record.id)}
