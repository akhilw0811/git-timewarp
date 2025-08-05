import random
import hashlib

def calculate_hotspot_score(file_path: str, churn_score: int) -> float:
    """Stub hotspot detection model that returns pseudo-random scores."""
    hash_obj = hashlib.md5(file_path.encode())
    seed = int(hash_obj.hexdigest()[:8], 16)
    random.seed(seed)
    
    base_score = random.uniform(0.1, 0.9)
    churn_factor = min(churn_score / 100.0, 1.0)
    
    hotspot_score = base_score * 0.7 + churn_factor * 0.3
    return min(hotspot_score, 1.0)

def get_file_complexity(file_path: str) -> float:
    """Stub complexity calculation based on file extension."""
    ext = file_path.split('.')[-1].lower()
    complexity_map = {
        'py': 0.8,
        'js': 0.7,
        'ts': 0.7,
        'java': 0.9,
        'cpp': 0.9,
        'c': 0.8,
        'go': 0.6,
        'rs': 0.7,
        'php': 0.6,
        'rb': 0.5
    }
    return complexity_map.get(ext, 0.5) 