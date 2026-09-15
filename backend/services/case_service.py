import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import InvestigationCase
from schemas.case import CaseCreate, CaseUpdate


async def create_case(db: AsyncSession, data: CaseCreate) -> InvestigationCase:
    """Create a new investigation case."""

    case = InvestigationCase(
        case_number=f"CASE-{str(uuid.uuid4())[:8].upper()}",
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        created_by=data.created_by,
    )

    db.add(case)
    await db.commit()
    await db.refresh(case)

    return case


async def get_cases(db: AsyncSession):
    """Return all investigation cases."""

    result = await db.execute(
        select(InvestigationCase).order_by(InvestigationCase.created_at.desc())
    )

    return result.scalars().all()


async def get_case(db: AsyncSession, case_id: str):
    """Return a single investigation case."""

    result = await db.execute(
        select(InvestigationCase).where(InvestigationCase.id == case_id)
    )

    return result.scalar_one_or_none()


async def update_case(
    db: AsyncSession,
    case: InvestigationCase,
    data: CaseUpdate,
):
    """Update an investigation case."""

    updates = data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(case, key, value)

    await db.commit()
    await db.refresh(case)

    return case


async def delete_case(
    db: AsyncSession,
    case: InvestigationCase,
):
    """Delete an investigation case."""

    await db.delete(case)
    await db.commit()