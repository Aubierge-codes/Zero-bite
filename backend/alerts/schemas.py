from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertResponse(BaseModel):
    id: str
    risk_level: str
    region: Optional[str]
    site_name: Optional[str]
    trigger_reason: Optional[str]
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None
    assigned_team_id: Optional[str] = None
