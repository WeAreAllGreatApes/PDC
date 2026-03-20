import json
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import starlette.status as status
import os
import requests
import urllib.parse
from fastapi.middleware.cors import CORSMiddleware
from classes import Search, Autocomplete, ReverseSearch, Address

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
ENDPOINT = 'https://api.mapbox.com/search/geocode/v6'


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
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
            "access_token": KEY,
        }
    )
    full_query = f"{ENDPOINT}/forward?{query}"
    res = requests.get(full_query)
    if res.status_code == 200:
        return json.loads(res.text)
    else:
        print('\033[91m','\t\t[ERROR] search returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500)




@app.post("/autocomplete")
async def autocomplete(search: Autocomplete):
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "proximity": f"{CENTER_LON},{CENTER_LAT}",
            "access_token": KEY,
            "autoomplete": 'true'
        }
    )
    res = requests.get(f'{ENDPOINT}/forward?{query}')
    
    if res.status_code == 200:
        return json.loads(res.text)
    else:
        print('\033[91m','\t\t[ERROR] autocomplete returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500, detail=res.text)


@app.post("/reverse")
async def reverse(search: ReverseSearch, raw: bool = False):
    query = urllib.parse.urlencode({
        'longitude': search.longitude,
        'latitude': search.latitude,
        'types': 'address',
        'access_token': KEY
    })
    res = requests.get(f'{ENDPOINT}/reverse?{query}')
    import pprint
    # pprint.pprint(res.json()['features'][0])
    # return res.json()
    if res.status_code == 200:
        if raw:
            return res.json()
        addresses = []
        for result in res.json()["features"]:
            pprint.pprint(result['properties'])
            # print('\033[91m',result['properties'],'\033[0m')
            addresses.append(Address(search,result['properties']).dict())
        return {"result": addresses}
    else:
        print('\033[91m','\t\t[ERROR] reverse returned', res.status_code, '\033[0m')
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

