import statistics
from typing import List, Dict

def detect_anomalies(costs: List[Dict], threshold: float = 2.0) -> List[Dict]:
    """
    Detect anomalies in cost data using Z-score.
    Returns the original list decorated with 'status': 'normal' or 'anomaly'.
    """
    if not costs:
        return []
        
    cost_values = [c["cost"] for c in costs]
    n = len(cost_values)
    
    # Needs at least 2 points for standard deviation
    if n < 2:
        return [{**c, "status": "normal"} for c in costs]
        
    mean = statistics.mean(cost_values)
    stdev = statistics.stdev(cost_values)
    
    result = []
    for c in costs:
        cost_val = c["cost"]
        # If standard deviation is 0, all values are the same, hence no anomalies.
        if stdev == 0:
            status = "normal"
        else:
            z_score = abs(cost_val - mean) / stdev
            status = "anomaly" if z_score > threshold else "normal"
            
        result.append({
            "date": c["date"],
            "cost": cost_val,
            "status": status
        })
        
    return result
