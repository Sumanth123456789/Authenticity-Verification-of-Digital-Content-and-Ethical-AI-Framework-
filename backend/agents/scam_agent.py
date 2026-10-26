"""
AI-Content Verification Hub - Scam & Social Engineering Classifier Agent
"""
from typing import Any, Dict
from .base import VerificationAgent, AgentContext, AgentOutcome
from services.call_analyzer_service import call_analyzer_service


class ScamClassifierAgent(VerificationAgent):
    name = "scam_social_engineering"

    async def run(self, context: AgentContext) -> AgentOutcome:
        payload = context.payload
        full_text = payload.get("transcript_text")
        file_path = payload.get("file_path") or payload.get("audio_path")

        if not full_text and file_path:
            analysis_res = call_analyzer_service.analyze_audio_file(file_path)
            full_text = analysis_res.get("call_transcript", {}).get("full_text", "")

        scam_res = call_analyzer_service.analyze_transcript_text(full_text or "")

        scam_cats = scam_res.get("scam_categories", [])
        risk_score = scam_res.get("text_risk_score", 0)

        if scam_cats:
            summary = f"Scam patterns detected ({', '.join(scam_cats)}). Text Risk Score: {risk_score}/100."
        else:
            summary = "No high-risk scam or coercion patterns found in transcript."

        return AgentOutcome(
            agent_name=self.name,
            status="completed",
            summary=summary,
            evidence_ids=[f"ev_scam_{context.case_id[:8]}"],
        )
