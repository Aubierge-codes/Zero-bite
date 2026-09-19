from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TeamCreate(BaseModel):
    name: str
    leader_name: str
    leader_phone: str
    district: str
    team_size: int = 4
    specialization: str = "general"


class TeamResponse(BaseModel):
    id: str
    name: str
    leader_name: str
    district: str
    team_size: int
    status: str
    specialization: str

    class Config:
        from_attributes = True


class AssignmentCreate(BaseModel):
    zone_id: str
    task_type: str = "larviciding"
    priority: str = "HIGH"
    notes: Optional[str] = None


class TreatmentRecordCreate(BaseModel):
    zone_id: str
    latitude: float
    longitude: float
    larvicide_ml_used: float
    site_type: str
    larvae_count_before: Optional[int] = None
    larvae_count_after: Optional[int] = None
    notes: Optional[str] = None


class TreatmentRecordResponse(BaseModel):
    id: str
    zone_id: str
    larvicide_ml_used: float
    site_type: str
    treated_at: datetime

    class Config:
        from_attributes = True
