from dataclasses import dataclass


@dataclass(frozen=True)
class RiskResult:
    score: int
    level: str


def risk_level(score: int) -> RiskResult:
    bounded = max(0, min(100, int(score)))
    if bounded <= 24:
        level = "Low"
    elif bounded <= 49:
        level = "Moderate"
    elif bounded <= 74:
        level = "High"
    else:
        level = "Critical"
    return RiskResult(score=bounded, level=level)
