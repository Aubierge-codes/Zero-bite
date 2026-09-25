from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import ContactMessage
from database.session import get_db

router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    organization: Optional[str] = Field(default=None, max_length=200)
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


@router.post("/")
async def submit_contact(payload: ContactRequest, db: AsyncSession = Depends(get_db)):
    """Public Contact form — stored so the team can follow up."""
    db.add(ContactMessage(name=payload.name, email=payload.email, organization=payload.organization,
                          subject=payload.subject, message=payload.message))
    await db.commit()
    return {"message": "Thanks — your message has been received."}
