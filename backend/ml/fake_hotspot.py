def random_hotspot(path: str, seed: int) -> float:
    """Generate fake hotspot scores based on file path and seed."""
    return 0.9 if hash(path + str(seed)) % 20 == 0 else 0.1
