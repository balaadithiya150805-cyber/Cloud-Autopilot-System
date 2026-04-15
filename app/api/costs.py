from fastapi import APIRouter
from typing import List
from app.models.cost_model import DailyCost, AnomalyCost, PredictionCost, ExplanationCost
from app.services.aws_cost_service import get_last_7_days_aws_cost
from app.services.db_service import store_cloud_costs, get_cloud_costs_by_source
from app.services.anomaly_service import detect_anomalies
from app.services.prediction_service import predict_costs
from app.services.explanation_service import explain_anomalies

router = APIRouter()

def _get_aws_costs_with_fallback() -> list:
    """Try DB first, fall back to fresh fetch if DB is empty/unavailable."""
    costs = get_cloud_costs_by_source(source="aws")
    if not costs:
        costs = get_last_7_days_aws_cost()
    return costs

@router.get("/aws", response_model=List[DailyCost])
def get_aws_costs():
    """
    Get AWS cost data for the last 7 days.
    Uses boto3 Cost Explorer if configured, otherwise returns mock data.
    """
    costs = get_last_7_days_aws_cost()
    store_cloud_costs(costs, source="aws")
    return costs

@router.get("/aws/anomalies", response_model=List[AnomalyCost])
def get_aws_anomalies():
    """
    Detect anomalies in AWS cost data.
    Falls back to fresh cost fetch if database is empty.
    """
    costs = _get_aws_costs_with_fallback()
    if not costs:
        return []

    anomalies = detect_anomalies(costs, threshold=2.0)
    return anomalies

@router.get("/aws/predict", response_model=List[PredictionCost])
def get_aws_predict():
    """
    Predict next 7 days of AWS cost data using simple linear regression.
    Falls back to fresh cost fetch if database is empty.
    """
    costs = _get_aws_costs_with_fallback()
    if not costs:
        return []

    predictions = predict_costs(costs, days_ahead=7)
    return predictions

@router.get("/aws/explain", response_model=List[ExplanationCost])
def get_aws_explain():
    """
    Fetch anomalous AWS data and provide actionable explanations.
    Falls back to fresh cost fetch if database is empty.
    """
    costs = _get_aws_costs_with_fallback()
    if not costs:
        return []

    anomalies = detect_anomalies(costs, threshold=2.0)
    explanations = explain_anomalies(anomalies)
    return explanations

