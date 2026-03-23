import json
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import starlette.status as status
import os
import requests
import urllib.parse
from fastapi.middleware.cors import CORSMiddleware
from classes import Search, Autocomplete, ReverseSearch, SearchResult, AutocompleteResult, Address

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
ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1'

# Search assistance:
BBOX = f'{CENTER_LON - 0.2},{CENTER_LAT - 0.2},{CENTER_LON + 0.2},{CENTER_LAT + 0.2}'
TYPES = 'address,poi,street'

@app.get("/", status_code=301)
async def index():
     return RedirectResponse(
        url="/ui", status_code=status.HTTP_301_MOVED_PERMANENTLY
     )

@app.post("/search")
async def search(search: Search):
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "bbox": BBOX,
            "types": TYPES,
            "access_token": KEY
        }
    )
    full_query = f"{ENDPOINT}/forward?{query}"
    res = requests.get(full_query)
    if res.status_code == 200:
        results = [SearchResult(r['properties']).dict() for r in json.loads(res.text)['features']]
        return {'results': results}
    else:
        print('\033[91m','\t\t[ERROR] search returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500)




@app.post("/autocomplete")
async def autocomplete(search: Autocomplete):
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "proximity": f"{CENTER_LON},{CENTER_LAT}",
            "auto_complete": 'true',
            "bbox": BBOX,
            "types": TYPES,
            "access_token": KEY
        }
    )
    full_query = f'{ENDPOINT}/forward?{query}'
    res = requests.get(full_query)
    
    if res.status_code == 200:
        results = {
            'suggestions': [{'placePrediction': AutocompleteResult(res['properties'])} for res in json.loads(res.text)['features']]
        } 
        return results
    else:
        print(query)
        print('\033[91m','\t\t[ERROR] autocomplete returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500, detail=res.text)


@app.post("/reverse")
async def reverse(search: ReverseSearch, raw: bool = False):
    query = urllib.parse.urlencode({
        'longitude': search.longitude,
        'latitude': search.latitude,
        'types': TYPES,
        'access_token': KEY
    })
    res = requests.get(f'{ENDPOINT}/reverse?{query}')
    if res.status_code == 200:
        if raw:
            return res.json()
        addresses = []
        for result in res.json()["features"]:
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

