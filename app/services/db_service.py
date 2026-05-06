"""
Database service – MongoDB connection management with graceful degradation.
Designed to never crash the app, even when MongoDB is unreachable.
"""

import time
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings
from app.core.logger import logger
from typing import List, Dict

# ── Connection ──────────────────────────────────────────
# Timeouts must be generous enough for cloud-hosted MongoDB (Atlas, etc.)
# but short enough to not block the app for too long.
_CONNECT_TIMEOUT_MS = 5000      # 5 seconds to establish TCP connection
_SERVER_SELECT_MS = 5000        # 5 seconds to pick a server from replica set
_SOCKET_TIMEOUT_MS = 10000      # 10 seconds for individual operations

try:
    client = MongoClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=_SERVER_SELECT_MS,
        connectTimeoutMS=_CONNECT_TIMEOUT_MS,
        socketTimeoutMS=_SOCKET_TIMEOUT_MS,
        # Retry writes once (Atlas requirement)
        retryWrites=True,
    )
    db = client[settings.MONGO_DB_NAME]
except Exception as e:
    # If even creating the client fails (e.g. malformed URI),
    # create a dummy client that will fail gracefully later.
    logger.error(f"Failed to create MongoDB client: {e}")
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=1000)
    db = client[settings.MONGO_DB_NAME]

cloud_costs_col = db["cloud_costs"]
users_col = db["users"]
sessions_col = db["sessions"]


# ── DB availability cache ───────────────────────────────
_db_available_cache: dict = {"available": False, "checked_at": 0.0}
_DB_CACHE_TTL = 30  # seconds


def _is_db_available() -> bool:
    """Quick ping to check if MongoDB is reachable. Caches result for 30s."""
    now = time.time()
    if now - _db_available_cache["checked_at"] < _DB_CACHE_TTL:
        return _db_available_cache["available"]
    try:
        client.admin.command("ping")
        _db_available_cache["available"] = True
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception):
        _db_available_cache["available"] = False
    _db_available_cache["checked_at"] = now
    return _db_available_cache["available"]


def init_db():
    """
    Ensure database indexes exist and verify connectivity.
    Uses exponential backoff. Never raises — logs errors instead.
    """
    retries = 3
    for attempt in range(retries):
        try:
            client.admin.command("ping")
            logger.info(f"MongoDB connected (attempt {attempt + 1}).")

            # Create indexes (idempotent)
            users_col.create_index("email", unique=True)
            cloud_costs_col.create_index("date")
            sessions_col.create_index("refresh_token", unique=True)
            sessions_col.create_index("expires_at", expireAfterSeconds=0)

            logger.info("MongoDB indexes created successfully.")
            _db_available_cache["available"] = True
            _db_available_cache["checked_at"] = time.time()
            return  # Success
        except Exception as e:
            wait = 2 ** attempt
            logger.warning(
                f"MongoDB connection attempt {attempt + 1}/{retries} failed: {e}. "
                f"Retrying in {wait}s..."
            )
            time.sleep(wait)

    logger.error(
        "MongoDB initialization failed after all retries. "
        "App will run in degraded mode (no database operations)."
    )


def store_cloud_costs(costs: List[Dict], source: str):
    """
    Store cloud costs into the database. Updates or inserts based on date and source.
    Silently skips if MongoDB is unreachable.
    """
    if not costs:
        return

    if not _is_db_available():
        logger.debug("MongoDB unavailable - skipping store.")
        return

    try:
        for cost in costs:
            cloud_costs_col.update_one(
                {"date": cost["date"], "source": source},
                {"$set": {"cost": cost["cost"]}},
                upsert=True,
            )
    except Exception as e:
        logger.warning(f"Database error during insert: {e}")


def get_cloud_costs_by_source(source: str) -> List[Dict]:
    """Retrieve all cloud costs for a specific source."""
    if not _is_db_available():
        logger.debug("MongoDB unavailable - returning empty list.")
        return []

    try:
        records = list(cloud_costs_col.find({"source": source}).sort("date", -1))
        return [
            {
                "date": str(r.get("date", "")),
                "cost": float(r.get("cost", 0.0)),
            }
            for r in records
        ]
    except Exception as e:
        logger.warning(f"Database error during fetch: {e}")
        return []
