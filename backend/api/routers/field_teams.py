from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from database.session import get_db
from database.models import FieldTeam, TreatmentRecord

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
async def create_team(
    name: str, leader_name: str, leader_phone: str,
    district: str, team_size: int = 4, specialization: str = "general",
    db: AsyncSession = Depends(get_db),
):
    team = FieldTeam(name=name, leader_name=leader_name, leader_phone=leader_phone,
                     district=district, team_size=team_size, specialization=specialization)
    db.add(team)
    await db.commit()
    return {"message": "Team created", "id": str(team.id)}


@router.post("/{team_id}/assign")
async def assign_team(team_id: str, zone_id: str, task_type: str = "larviciding",
                      db: AsyncSession = Depends(get_db)):
    team = await db.get(FieldTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.status = "deployed"
    await db.commit()
    return {"message": f"Team {team.name} assigned to zone {zone_id}"}


@router.post("/{team_id}/treatment-log")
async def log_treatment(
    team_id: str, zone_id: str, latitude: float, longitude: float,
    larvicide_ml_used: float, site_type: str,
    larvae_before: int = 0, larvae_after: int = 0,
    db: AsyncSession = Depends(get_db),
):
    record = TreatmentRecord(
        team_id=team_id, zone_id=zone_id, latitude=latitude, longitude=longitude,
        larvicide_ml_used=larvicide_ml_used, site_type=site_type,
        larvae_count_before=larvae_before, larvae_count_after=larvae_after,
        treated_at=datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    return {"message": "Treatment logged", "id": str(record.id)}
