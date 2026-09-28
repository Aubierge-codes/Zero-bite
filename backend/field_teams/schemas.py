from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    leader_name: str = Field(min_length=2, max_length=200)
    leader_phone: Optional[str] = None
    district: str
    team_size: int = Field(default=4, ge=1, le=100)
    specialization: str = "general"


class TeamStatusUpdate(BaseModel):
    status: str = Field(pattern="^(available|deployed|off_duty)$")


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
    """A breeding-site treatment logged from the field (web or mobile app)."""
    district: str
    team_id: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-3.0, le=-1.0)     # Rwanda bounds
    longitude: Optional[float] = Field(default=None, ge=28.8, le=31.0)
    larvicide_ml_used: float = Field(ge=0, le=100000)
    site_type: str = Field(min_length=2, max_length=100)
    larvae_count_before: Optional[int] = Field(default=None, ge=0)
    larvae_count_after: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=2000)


class TreatmentRecordResponse(BaseModel):
    id: str
    zone_id: str
    larvicide_ml_used: float
    site_type: str
    treated_at: datetime

    class Config:
        from_attributes = True
