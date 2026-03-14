from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
MODEL_DIR = ROOT_DIR / "ml_models"


def ensure_directories() -> None:
    for directory in [DATA_DIR, UPLOAD_DIR, MODEL_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
