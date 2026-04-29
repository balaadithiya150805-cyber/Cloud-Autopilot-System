from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List
from app.models.cost_model import DailyCost, AnomalyCost, PredictionCost, ExplanationCost
from app.services.aws_cost_service import get_last_7_days_aws_cost
from app.services.db_service import store_cloud_costs, get_cloud_costs_by_source, users_col
from app.services.anomaly_service import detect_anomalies
from app.services.prediction_service import predict_costs
from app.services.explanation_service import explain_anomalies
from app.services.recommendation_service import generate_recommendations
from app.services.encryption_service import encrypt_value
from app.services.email_service import send_email
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

class ConnectAWSRequest(BaseModel):
    access_key_id: str
    secret_access_key: str

def _get_aws_costs_with_fallback(user_email: str) -> list:
    """Try DB first, fall back to fresh fetch if DB is empty/unavailable."""
    costs = get_cloud_costs_by_source(source="aws")
    if not costs:
        costs = get_last_7_days_aws_cost(user_email)
    return costs

@router.get("/aws", response_model=List[DailyCost])
def get_aws_costs(current_user: dict = Depends(get_current_user)):
    """
    Get AWS cost data for the last 7 days.
    Uses boto3 Cost Explorer if configured, otherwise returns mock data.
    """
    costs = get_last_7_days_aws_cost(current_user["email"])
    store_cloud_costs(costs, source="aws")
    return costs

def send_anomaly_alert_email(email: str, anomalies: List[AnomalyCost]):
    """Background task to send alert email."""
    if not anomalies:
        return
    
    subject = f"Cloud Autopilot Alert: {len(anomalies)} Cost Anomalies Detected"
    body = f"Hello,\n\nWe detected {len(anomalies)} cost anomalies in your AWS account today.\n\n"
    for a in anomalies:
        body += f"- Date: {a.date}, Cost: ${a.cost:.2f}, Expected: ${a.expected_cost:.2f}\n"
    body += "\nLog in to your Cloud Autopilot dashboard to view details.\n"
    
    send_email(email, subject, body)

@router.get("/aws/anomalies", response_model=List[AnomalyCost])
def get_aws_anomalies(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    costs = _get_aws_costs_with_fallback(current_user["email"])
    if not costs:
        return []
    anomalies = detect_anomalies(costs, threshold=2.0)
    
    # If anomalies exist, schedule email alert
    if anomalies:
        background_tasks.add_task(send_anomaly_alert_email, current_user["email"], anomalies)
        
    return anomalies

@router.get("/aws/predict", response_model=List[PredictionCost])
def get_aws_predict(current_user: dict = Depends(get_current_user)):
    costs = _get_aws_costs_with_fallback(current_user["email"])
    if not costs:
        return []
    predictions = predict_costs(costs, days_ahead=7)
    return predictions

@router.get("/aws/explain", response_model=List[ExplanationCost])
def get_aws_explain(current_user: dict = Depends(get_current_user)):
    costs = _get_aws_costs_with_fallback(current_user["email"])
    if not costs:
        return []
    anomalies = detect_anomalies(costs, threshold=2.0)
    explanations = explain_anomalies(anomalies)
    return explanations

@router.get("/aws/recommendations")
def get_aws_recommendations(current_user: dict = Depends(get_current_user)):
    """Fetch actionable cost-saving insights."""
    costs = _get_aws_costs_with_fallback(current_user["email"])
    if not costs:
        return []
    return generate_recommendations(costs)

@router.post("/aws/connect")
def connect_aws(req: ConnectAWSRequest, current_user: dict = Depends(get_current_user)):
    """Encrypt and store AWS credentials for the current user."""
    try:
        users_col.update_one(
            {"email": current_user["email"].lower()},
            {"$set": {
                "aws_access_key_id": encrypt_value(req.access_key_id),
                "aws_secret_access_key": encrypt_value(req.secret_access_key)
            }}
        )
        return {"message": "AWS credentials connected successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect AWS: {str(e)}")

