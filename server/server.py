import json
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import starlette.status as status
import os
import requests
from pydantic import BaseModel
import urllib.parse
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/ui", StaticFiles(directory="/app/static", html=True))

KEY = os.getenv("MAPS_KEY")
if KEY == None:
  with open(os.environ["MAPS_KEY_FILE"]) as f:
    KEY = f.read().strip()
print("API key: "+KEY)
MAPS_URL = os.environ["MAPS_URL"]
CENTER_LAT = float(os.environ["CENTER_LAT"])
CENTER_LON = float(os.environ["CENTER_LON"])


class Search(BaseModel):
    search: str

@app.get("/", status_code=301)
async def index():
     return RedirectResponse(
        url="/ui", status_code=status.HTTP_301_MOVED_PERMANENTLY
     )

@app.post("/search")
async def search(search: Search):
    min_lat = CENTER_LAT - 0.2
    max_lat = CENTER_LAT + 0.2
    min_lon = CENTER_LON - 0.2
    max_lon = CENTER_LON + 0.2
    term = urllib.parse.urlencode(
        {
            "address": search.search,
            "bounds": f"{min_lat},{min_lon}|{max_lat},{max_lon}",
            "key": KEY,
        }
    )
    res = requests.get(f"https://maps.googleapis.com/maps/api/geocode/json?{term}")
    if res.status_code == 200:
        return json.loads(res.text)
    else:
        raise HTTPException(status_code=500)


class Autocomplete(BaseModel):
    search: str


@app.post("/autocomplete")
async def autocomplete(search: Autocomplete):
    res = requests.post(
        "https://places.googleapis.com/v1/places:autocomplete",
        headers={"X-Goog-Api-Key": KEY, "Content-Type": "application/json"},
        data=json.dumps({
            "input": search.search,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": CENTER_LAT, "longitude": CENTER_LON},
                    "radius": 20000.0,
                }
            },
        }),
    )
    if res.status_code == 200:
        return json.loads(res.text)
    else:
        raise HTTPException(status_code=500, detail=res.text)


class ReverseSearch(BaseModel):
    latitude: float
    longitude: float


def geo_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = lat1 * math.pi / 180.0
    phi2 = lat2 * math.pi / 180.0
    dphi = (lat2 - lat1) * math.pi / 180.0
    dlambda = (lon2 - lon1) * math.pi / 180.0

    a = math.sin(dphi / 2) * math.sin(dphi / 2) + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) * math.sin(dlambda / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


@app.post("/reverse")
async def reverse(search: ReverseSearch, raw: bool = False):
    res = requests.get(
        f"https://geocode.googleapis.com/v4beta/geocode/location/{search.latitude},{search.longitude}",
        headers={"X-Goog-Api-Key": KEY},
    )
    if res.status_code == 200:
        if raw:
            return res.json()
        addresses = []
        for result in res.json()["results"]:
            addr = {
                "latitude": result["location"]["latitude"],
                "longitude": result["location"]["longitude"],
                "distance": geo_distance(search.latitude, search.longitude, result["location"]["latitude"], result["location"]["longitude"]),
                "address": result["formattedAddress"],
            }
            if "postalAddress" in result:
                addr["structuredAddress"] = result["postalAddress"]
            addresses.append(addr)
        return {"result": addresses}
    else:
        raise HTTPException(status_code=500, detail=res.text)


@app.get("/environ.js")
async def get_environ():
    headers = {}
    headers["content-type"] = "application/javascript"
    content = f"""
var GEO_BASE_URL = "{MAPS_URL}";
var DEFAULT_MAP_CENTER = {{ lat: {CENTER_LAT}, lon: {CENTER_LON} }};
"""
    return Response(content=content, headers=headers)
