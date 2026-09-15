from .base import AgentContext, AgentOutcome, VerificationAgent


class SupervisorAgent(VerificationAgent):
    name = "supervisor"

    async def run(self, context: AgentContext) -> AgentOutcome:
        # Phase 1 only: deterministic planning skeleton.
        # Real call-analysis tools are added in the next phase.
        return AgentOutcome(
            agent_name=self.name,
            status="planned",
            summary=f"Verification plan created for content type: {context.content_type}",
        )
