import math

def geo_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1 = lat1 * math.pi / 180.0
    phi2 = lat2 * math.pi / 180.0
    dphi = (lat2 - lat1) * math.pi / 180.0
    dlambda = (lon2 - lon1) * math.pi / 180.0

    a = math.sin(dphi / 2) * math.sin(dphi / 2) + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) * math.sin(dlambda / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c