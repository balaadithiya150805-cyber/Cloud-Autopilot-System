import logging
import sys

def setup_logger():
    logger = logging.getLogger("cloud_autopilot")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        sh = logging.StreamHandler(sys.stdout)
        sh.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        sh.setFormatter(formatter)
        logger.addHandler(sh)
    return logger

logger = setup_logger()
