import time
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings
from app.core.logger import logger
from typing import List, Dict

client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=500, connectTimeoutMS=500, socketTimeoutMS=1000)
db = client[settings.MONGO_DB_NAME]
cloud_costs_col = db["cloud_costs"]

# Cache the DB availability result so we don't ping on every request
_db_available_cache: dict = {"available": False, "checked_at": 0.0}
_DB_CACHE_TTL = 30  # seconds

def _is_db_available() -> bool:
    """Quick ping to check if MongoDB is reachable. Caches result for 30s."""
    now = time.time()
    if now - _db_available_cache["checked_at"] < _DB_CACHE_TTL:
        return _db_available_cache["available"]
    try:
        client.admin.command('ping')
        _db_available_cache["available"] = True
    except (ConnectionFailure, ServerSelectionTimeoutError):
        _db_available_cache["available"] = False
    _db_available_cache["checked_at"] = now
    return _db_available_cache["available"]

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
