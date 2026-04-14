"""Валидация этапов лида/сделки."""

from app.schemas.crm_opportunity import LEAD_STAGES, DEAL_STAGES


def default_stage(kind: str) -> str:
    if kind == "lead":
        return "new"
    return "discovery"


def validate_stage(kind: str, stage: str) -> None:
    allowed = LEAD_STAGES if kind == "lead" else DEAL_STAGES
    if stage not in allowed:
        joined = ", ".join(allowed)
        raise ValueError(f"Недопустимый этап для {kind}: {stage}. Допустимо: {joined}")
