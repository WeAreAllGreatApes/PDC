from fastapi import FastAPI, Response
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import starlette.status as status
from fastapi.middleware.cors import CORSMiddleware
from classes import Location
import geocode

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/ui", StaticFiles(directory="/app/static", html=True))

@app.get("/", status_code=301)
async def index():
     return RedirectResponse(
        url="/ui", status_code=status.HTTP_301_MOVED_PERMANENTLY
     )

@app.post("/search")
async def search(search: geocode.Search):
    return geocode.search(search)

@app.post("/autocomplete")
async def autocomplete(search: geocode.Search):
    return geocode.autocomplete(search)

@app.post("/reverse")
async def reverse(search: Location, raw: bool = False):
    return geocode.reverse(search, raw)

@app.get("/environ.js")
async def get_environ():
    headers = {}
    headers["content-type"] = "application/javascript"
    content = f"""
var GEO_BASE_URL = "{geocode.MAPS_URL}";
var DEFAULT_MAP_CENTER = {{ lat: {geocode.DEFAULT_LAT}, lon: {geocode.DEFAULT_LON} }};
    """
    return Response(content=content, headers=headers)

