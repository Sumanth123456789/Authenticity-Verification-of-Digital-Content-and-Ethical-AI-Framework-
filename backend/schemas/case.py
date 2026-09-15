from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from database.models import (
    CaseCategoryEnum,
    CasePriorityEnum,
    CaseStatusEnum,
)


class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: CaseCategoryEnum
    priority: CasePriorityEnum
    created_by: Optional[str] = "Analyst"


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[CaseCategoryEnum] = None
    priority: Optional[CasePriorityEnum] = None
    status: Optional[CaseStatusEnum] = None
    risk_score: Optional[int] = None
    final_verdict: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    description: Optional[str]
    category: CaseCategoryEnum
    priority: CasePriorityEnum
    status: CaseStatusEnum
    created_by: Optional[str]
    risk_score: Optional[int]
    final_verdict: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }