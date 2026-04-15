import statistics
from typing import List, Dict

def explain_anomalies(anomalies: List[Dict]) -> List[Dict]:
    """
    Provide explanations and suggestions for anomalous costs.
    Calculates the % increase from average and appends explanation data.
    """
    if not anomalies:
        return []
        
    cost_values = [a["cost"] for a in anomalies]
    avg_cost = statistics.mean(cost_values) if cost_values else 0.0

    results = []
    for item in anomalies:
        explained_item = dict(item)
        
        if explained_item.get("status") == "anomaly" and avg_cost > 0:
            diff = explained_item["cost"] - avg_cost
            pct_increase = (diff / avg_cost) * 100
            
            explained_item["reason"] = f"Cost spiked by {pct_increase:.1f}% compared to the average cost of ${avg_cost:.2f}."
            explained_item["suggestion"] = "Review recent resource provisioning or newly launched services to identify the spike."
        else:
            explained_item["reason"] = None
            explained_item["suggestion"] = None
            
        results.append(explained_item)

    return results
