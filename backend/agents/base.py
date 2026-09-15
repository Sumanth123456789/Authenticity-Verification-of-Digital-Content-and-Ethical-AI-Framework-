from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentContext:
    case_id: str
    content_type: str
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentOutcome:
    agent_name: str
    status: str
    evidence_ids: list[str] = field(default_factory=list)
    summary: str = ""
    error: str | None = None


class VerificationAgent(ABC):
    name: str

    @abstractmethod
    async def run(self, context: AgentContext) -> AgentOutcome:
        """Run one auditable agent step and return structured output."""
        raise NotImplementedError
