from .base import AgentContext, AgentOutcome, VerificationAgent


class EvidenceCriticAgent(VerificationAgent):
    name = "evidence_critic"

    async def run(self, context: AgentContext) -> AgentOutcome:
        return AgentOutcome(
            agent_name=self.name,
            status="not_run",
            summary="Evidence validation is enabled after real detector evidence exists.",
        )
