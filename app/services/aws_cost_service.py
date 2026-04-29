import boto3
from datetime import datetime, timedelta
from app.core.logger import logger
from app.core.config import settings
from app.services.db_service import users_col
from app.services.encryption_service import decrypt_value

def get_last_7_days_aws_cost(user_email: str):
    try:
        user = users_col.find_one({"email": user_email.lower()})
        if not user or not user.get("aws_access_key_id"):
            logger.info("No AWS credentials found for user, using mock data.")
            return get_mock_cost_data()

        aws_access_key = decrypt_value(user["aws_access_key_id"])
        aws_secret_key = decrypt_value(user["aws_secret_access_key"])

        client = boto3.client(
            'ce', 
            region_name=settings.AWS_DEFAULT_REGION,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
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
            
        logger.info(f"Successfully fetched AWS costs for {user_email}.")
        return costs

    except Exception as e:
        logger.warning(f"Failed to fetch AWS costs for {user_email}: {str(e)}. Using fallback mock data.")
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
