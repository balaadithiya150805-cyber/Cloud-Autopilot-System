from pydantic import BaseModel

class DailyCost(BaseModel):
    date: str
    cost: float

class AnomalyCost(DailyCost):
    status: str

class PredictionCost(BaseModel):
    date: str
    predicted_cost: float
    lower_bound: float | None = None
    upper_bound: float | None = None

class ExplanationCost(AnomalyCost):
    reason: str | None = None
    suggestion: str | None = None
