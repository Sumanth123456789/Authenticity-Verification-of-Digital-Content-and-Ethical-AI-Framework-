"""
AI-Content Verification Hub — Investigation Case Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from database.models import InvestigationCase
from schemas.case import CaseCreate, CaseUpdate, CaseResponse
from services.case_service import (
    create_case,
    get_cases,
    get_case,
    update_case,
    delete_case,
)

router = APIRouter(
    prefix="/api/v1/cases",
    tags=["Investigation Cases"],
)


@router.post("", response_model=CaseResponse)
async def create_new_case(
    payload: CaseCreate,
    db: AsyncSession = Depends(get_db),
):
    return await create_case(db, payload)


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    db: AsyncSession = Depends(get_db),
):
    return await get_cases(db)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_single_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    case = await get_case(db, case_id)

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.put("/{case_id}", response_model=CaseResponse)
async def edit_case(
    case_id: str,
    payload: CaseUpdate,
    db: AsyncSession = Depends(get_db),
):
    case = await get_case(db, case_id)

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return await update_case(db, case, payload)


@router.delete("/{case_id}")
async def remove_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    case = await get_case(db, case_id)

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    await delete_case(db, case)

    return {"message": "Case deleted successfully"}