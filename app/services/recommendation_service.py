from typing import List, Dict
from datetime import datetime
from app.core.logger import logger
from app.models.cost_model import DailyCost

def generate_recommendations(costs: List[Dict]) -> List[Dict]:
    """
    Generate actionable cost-saving recommendations based on recent cost trends.
    Uses simple rule-based heuristics.
    """
    if not costs or len(costs) < 2:
        return []

    # costs are ordered by date descending? Usually ascending or descending depending on source.
    # Ensure they are sorted ascending by date for trend analysis.
    sorted_costs = sorted(costs, key=lambda x: x["date"])
    
    recommendations = []
    
    # 1. Zero fluctuation / High cost (Potential Idle Resource)
    # If costs are exactly the same for 7 days but > $10/day, might be idle EC2/RDS.
    if len(sorted_costs) >= 7:
        recent_7 = sorted_costs[-7:]
        values = [c["cost"] for c in recent_7]
        avg = sum(values) / len(values)
        if avg > 10.0 and all(abs(v - avg) < 0.5 for v in values):
             recommendations.append({
                 "type": "idle_resource",
                 "title": "Potential Idle Resources",
                 "description": f"Your costs have been completely flat at ~${avg:.2f}/day for a week. Check for unused EC2 or RDS instances.",
                 "severity": "high",
                 "impact": f"~${avg * 30:.2f}/mo"
             })

    # 2. Week-over-week spike
    if len(sorted_costs) >= 7:
        current_day = sorted_costs[-1]["cost"]
        last_week_day = sorted_costs[max(0, len(sorted_costs) - 8)]["cost"]
        
        if last_week_day > 0 and (current_day - last_week_day) / last_week_day > 0.2:
            recommendations.append({
                "type": "cost_spike",
                "title": "Sudden Cost Spike Detected",
                "description": f"Today's cost (${current_day:.2f}) is >20% higher than exactly a week ago (${last_week_day:.2f}). Investigate recent deployments.",
                "severity": "high",
                "impact": f"+${(current_day - last_week_day):.2f}/day"
            })

    # 3. Micro-optimizations
    if len(sorted_costs) > 0:
        latest = sorted_costs[-1]["cost"]
        if latest > 50:
            recommendations.append({
                "type": "savings_plan",
                "title": "Consider AWS Savings Plans",
                "description": "Your daily spend qualifies for Compute Savings Plans which can reduce costs by up to 72%.",
                "severity": "medium",
                "impact": "Up to 72% compute savings"
            })

    # 4. Rising trend: 3+ consecutive daily increases
    if len(sorted_costs) >= 3:
        recent_3 = sorted_costs[-3:]
        if all(recent_3[i + 1]["cost"] > recent_3[i]["cost"] for i in range(len(recent_3) - 1)):
            rise_pct = ((recent_3[-1]["cost"] - recent_3[0]["cost"]) / max(recent_3[0]["cost"], 0.01)) * 100
            recommendations.append({
                "type": "rising_trend",
                "title": "Costs Are Trending Upward",
                "description": f"Costs have increased for 3 consecutive days (+{rise_pct:.0f}%). Review auto-scaling rules and scheduled jobs.",
                "severity": "medium",
                "impact": f"+{rise_pct:.0f}% over 3 days"
            })

    # 5. High daily average
    if len(sorted_costs) > 0:
        overall_avg = sum(c["cost"] for c in sorted_costs) / len(sorted_costs)
        if overall_avg > 30:
            recommendations.append({
                "type": "high_spend",
                "title": "High Average Daily Spend",
                "description": f"Your average daily cost is ${overall_avg:.2f}. Consider reserved instances or spot instances for batch workloads.",
                "severity": "medium",
                "impact": f"${overall_avg:.2f}/day avg"
            })

    # Always suggest setting up budgets if no other recommendations
    if not recommendations:
        recommendations.append({
            "type": "budget",
            "title": "Set up AWS Budgets",
            "description": "Enable AWS Budgets to get alerted before you exceed your limits.",
            "severity": "low",
            "impact": "Prevent overruns"
        })

    return recommendations
