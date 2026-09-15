from .base import AgentContext, AgentOutcome, VerificationAgent


class DecisionAgent(VerificationAgent):
    name = "decision"

    async def run(self, context: AgentContext) -> AgentOutcome:
        return AgentOutcome(
            agent_name=self.name,
            status="not_run",
            summary="No verdict is produced until real evidence is available.",
        )
