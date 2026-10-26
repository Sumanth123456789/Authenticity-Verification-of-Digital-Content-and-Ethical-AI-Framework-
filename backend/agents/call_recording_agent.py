"""
AI-Content Verification Hub - Call Recording & Audio Forensic Agent
"""
from typing import Any, Dict
from .base import VerificationAgent, AgentContext, AgentOutcome
from services.call_analyzer_service import call_analyzer_service


class CallRecordingAgent(VerificationAgent):
    name = "call_recording_forensics"

    async def run(self, context: AgentContext) -> AgentOutcome:
        payload = context.payload
        file_path = payload.get("file_path") or payload.get("audio_path")

        if not file_path:
            return AgentOutcome(
                agent_name=self.name,
                status="failed",
                summary="No audio file path provided for call recording analysis.",
                error="missing_file_path"
            )

        analysis_res = call_analyzer_service.analyze_audio_file(file_path)

        synthetic_prob = analysis_res.get("call_transcript", {}).get("synthetic_voice_probability", 0.0)
        duration = analysis_res.get("duration_seconds", 0.0)

        summary = (
            f"Acoustic analysis completed. Duration: {duration:.1f}s. "
            f"Synthetic Voice Clone Probability: {synthetic_prob:.1%}."
        )

        return AgentOutcome(
            agent_name=self.name,
            status="completed",
            summary=summary,
            evidence_ids=[f"ev_acoustic_{context.case_id[:8]}"],
        )
