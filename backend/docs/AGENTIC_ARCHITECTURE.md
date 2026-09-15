# Agentic Verification Architecture

## Principle

Agents do not invent verification results. They orchestrate real tools, store structured evidence,
validate contradictions, and produce an auditable decision.

## Planned call workflow

1. Create Verification Case
2. Supervisor Agent plans required checks
3. Transcription Agent produces timestamped transcript evidence
4. Call Classification Agent classifies legitimate/promotional/spam/suspicious/scam intent
5. Scam & Social Engineering Agent extracts risky statements
6. Evidence Critic checks duplication, contradictions, low-quality transcript, and unsupported claims
7. Decision Agent uses only stored evidence
8. Persist case, agent runs, evidence, result, and audit events

## Enterprise entities planned

- VerificationCase
- AgentRun
- Evidence
- AnalysisResult
- CallTranscript
- TranscriptSegment
- AuditEvent

## Non-negotiable rules

- No Math.random() for analysis
- No UI-generated confidence
- No verdict without evidence
- Failed detectors remain failed; they are never replaced with fabricated values
- Agent trace exposes actions and evidence, not private chain-of-thought
