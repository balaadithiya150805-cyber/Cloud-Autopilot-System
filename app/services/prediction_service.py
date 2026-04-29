import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import List, Dict

def predict_costs(costs: List[Dict], days_ahead: int = 7) -> List[Dict]:
    """
    Predict future costs using simple linear regression based on past costs.
    Returns a list of dicts with 'date' and 'predicted_cost'.
    """
    if not costs:
        return []

    # Sort costs chronologically (oldest to newest)
    sorted_costs = sorted(costs, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"))
    
    # We need sequential inputs (e.g., days since the first record)
    first_date = datetime.strptime(sorted_costs[0]["date"], "%Y-%m-%d")
    
    X = []
    y = []
    
    for c in sorted_costs:
        current_date = datetime.strptime(c["date"], "%Y-%m-%d")
        days_since = (current_date - first_date).days
        X.append([days_since])
        y.append(c["cost"])
        
    # If there are fewer than 2 points, just return the constant average cost
    if len(X) < 2:
        avg_cost = y[0] if y else 0.0
        return _generate_constant_predictions(sorted_costs[-1]["date"], avg_cost, days_ahead)

    model = LinearRegression()
    model.fit(X, y)
    
    # Predict the next 'days_ahead' days
    last_date = datetime.strptime(sorted_costs[-1]["date"], "%Y-%m-%d")
    last_day_index = (last_date - first_date).days
    
    predictions = []
    for i in range(1, days_ahead + 1):
        target_day_index = last_day_index + i
        target_date = last_date + timedelta(days=i)
        
        # Predict
        predicted_val = model.predict([[target_day_index]])[0]
        # Avoid negative costs
        predicted_cost = max(0.0, round(float(predicted_val), 2))
        
        # Simple +/- 10% confidence interval
        margin = predicted_cost * 0.10
        lower_bound = max(0.0, round(predicted_cost - margin, 2))
        upper_bound = round(predicted_cost + margin, 2)
        
        predictions.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_cost": predicted_cost,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        })
        
    return predictions

def _generate_constant_predictions(last_date_str: str, cost: float, days_ahead: int) -> List[Dict]:
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
    predictions = []
    
    margin = cost * 0.10
    lower_bound = max(0.0, round(cost - margin, 2))
    upper_bound = round(cost + margin, 2)
    
    for i in range(1, days_ahead + 1):
        target_date = last_date + timedelta(days=i)
        predictions.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_cost": round(cost, 2),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        })
    return predictions
