import boto3
from datetime import datetime, timedelta
from app.core.logger import logger
from app.core.config import settings

def get_last_7_days_aws_cost():
    try:
        # Check if AWS credentials are set (or if environment has IAM role etc)
        # Even without explicit env vars, boto3 might work if aws cli is configured
        client = boto3.client(
            'ce', 
            region_name=settings.AWS_DEFAULT_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=7)

        response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost']
        )
        
        costs = []
        for result in response.get('ResultsByTime', []):
            cost_amount = float(result['Total']['UnblendedCost']['Amount'])
            date_str = result['TimePeriod']['Start']
            costs.append({
                "date": date_str,
                "cost": round(cost_amount, 2)
            })
            
        logger.info("Successfully fetched AWS costs from Cost Explorer.")
        return costs

    except Exception as e:
        logger.warning(f"Failed to fetch AWS costs: {str(e)}. Using fallback mock data.")
        return get_mock_cost_data()

def get_mock_cost_data():
    """Fallback method for mock daily cost data."""
    costs = []
    end_date = datetime.utcnow().date()
    # Return 7 days of mock data past dates
    for i in range(7, 0, -1):
        target_date = end_date - timedelta(days=i)
        costs.append({
            "date": target_date.strftime('%Y-%m-%d'),
            "cost": round(15.0 + (i * 1.5), 2)  # dummy calculation
        })
    return costs
