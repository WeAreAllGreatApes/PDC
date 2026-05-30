import json
from fastapi import HTTPException
from pydantic import BaseModel
import os
import requests
import urllib.parse
from classes import Location, SearchResult, AutocompleteResult, Address
from usaddress import tag
from geopy.distance import distance

# Initialization
KEY = os.getenv("MAPS_KEY")
if KEY == None:
  with open(os.environ["MAPS_KEY_FILE"]) as f:
    KEY = f.read().strip()
print("API key: "+KEY)
# Environment variables:
MAPS_URL = os.environ["MAPS_URL"]
DEFAULT_LAT = float(os.environ["CENTER_LAT"])
DEFAULT_LON = float(os.environ["CENTER_LON"])
# POI searching (monetarily expensive):
SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1'
# General searching (cheap, but can't do POIs):
GEOCODE = 'https://api.mapbox.com/search/geocode/v6'

class Search(BaseModel):
    search: str
    center: Location | None = None
    radius: float | None = None # radius miles

    def bbox(self):
        # Fall back on default lat/long:
        if not (self.center and self.center.latitude and self.center.longitude):
            self.center = Location(latitude=DEFAULT_LAT,longitude=DEFAULT_LON)
        if not self.radius: self.radius = 10

        dist = distance(miles=self.radius)
        bottom_left = dist.destination((self.center.latitude,self.center.longitude),225) 
        top_right = dist.destination((self.center.latitude,self.center.longitude),45)

        smallest = Location(latitude=min(bottom_left.latitude,top_right.latitude),longitude=min(bottom_left.longitude,top_right.longitude))
        largest = Location(latitude=max(bottom_left.latitude,top_right.latitude),longitude=max(bottom_left.longitude,top_right.longitude))

        return f'{smallest.longitude},{smallest.latitude},{largest.longitude},{largest.latitude}'


def search(search: Search):
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "bbox": search.bbox(),
            "access_token": KEY
        }
    )
    
    try:
        type = tag(search.search)[1]
        assert type in ['Intersection']
        full_query = f"{GEOCODE}/forward?{query}"
    except:
        full_query = f"{SEARCHBOX}/forward?{query}"
        
    res = requests.get(full_query)
    if res.status_code == 200:
        results = [SearchResult(r['properties']).dict() for r in json.loads(res.text)['features']]
        return {'results': results}
    else:
        print('\033[91m','[ERROR] search returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500)

def autocomplete(search: Search):
    query = urllib.parse.urlencode(
        {
            "q": search.search,
            "bbox": search.bbox(),
            "access_token": KEY
        }
    )
    
    try:
        type = tag(search.search)[1]
        assert type in ['Intersection']
        query += f'&autocomplete=true'
        full_query = f"{GEOCODE}/forward?{query}"
    except:
        query += f'&auto_complete=true'
        full_query = f'{SEARCHBOX}/forward?{query}'

    res = requests.get(full_query)
    
    if res.status_code == 200:
        results = {
            'suggestions': [{'placePrediction': AutocompleteResult(res['properties']).dict()} for res in json.loads(res.text)['features']]
        } 
        return results
    else:
        print('\033[91m','[ERROR] autocomplete returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500, detail=res.text)

def reverse(search: Location, raw: bool = False):
    query = urllib.parse.urlencode({
        'longitude': search.longitude,
        'latitude': search.latitude,
        'access_token': KEY
    })
    res = requests.get(f'{GEOCODE}/reverse?{query}')
    
    if res.status_code == 200:
        if raw:
            return res.json()
        addresses = []
        for result in res.json()["features"]:
            addresses.append(Address(search,result['properties']).dict())
        return {"result": addresses}
    else:
        print('\033[91m','[ERROR] reverse returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500, detail=res.text)        
