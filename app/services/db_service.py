from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings
from app.core.logger import logger
from typing import List, Dict

client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[settings.MONGO_DB_NAME]
cloud_costs_col = db["cloud_costs"]

def _is_db_available() -> bool:
    """Quick ping to check if MongoDB is reachable."""
    try:
        client.admin.command('ping')
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError):
        return False

def store_cloud_costs(costs: List[Dict], source: str):
    """
    Store cloud costs into the database. Updates or inserts based on date and source.
    Silently skips if MongoDB is unreachable.
    """
    if not costs:
        return

    if not _is_db_available():
        logger.debug("MongoDB unavailable — skipping store.")
        return

    try:
        for cost in costs:
            cloud_costs_col.update_one(
                {"date": cost["date"], "source": source},
                {"$set": {"cost": cost["cost"]}},
                upsert=True
            )
    except Exception as e:
        logger.warning(f"Database error during insert: {e}")

def get_cloud_costs_by_source(source: str) -> List[Dict]:
    """Retrieve all cloud costs for a specific source."""
    if not _is_db_available():
        logger.debug("MongoDB unavailable — returning empty list.")
        return []

    try:
        records = list(cloud_costs_col.find({"source": source}).sort("date", -1))
        return [
            {
                "date": str(r.get("date", "")),
                "cost": float(r.get("cost", 0.0))
            } for r in records
        ]
    except Exception as e:
        logger.warning(f"Database error during fetch: {e}")
        return []
