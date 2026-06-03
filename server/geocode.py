import json
from fastapi import HTTPException
from pydantic import BaseModel
import os
import requests
import urllib.parse
from classes import Location, SearchResult, AutocompleteResult, Address
from usaddress import tag
from urllib.parse import urlencode
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
# POI searching (monetarily expensive, bad at intersections):
SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1'
# General searching (cheap, good at intersections, can't do POIs):
GEOCODE = 'https://api.mapbox.com/search/geocode/v6'

class Search(BaseModel):
    search: str
    center: Location | None = Location(latitude=DEFAULT_LAT,longitude=DEFAULT_LON)
    radius: float | None = 10 # radius, miles
    cities_only: bool | None = False # If true, search only for cities

    def bbox(self) -> str:
        '''Gets the bounding box of a search'''

        dist = distance(miles=self.radius)
        bottom_left = dist.destination((self.center.latitude,self.center.longitude),225) 
        top_right = dist.destination((self.center.latitude,self.center.longitude),45)

        smallest = Location(latitude=min(bottom_left.latitude,top_right.latitude),
                            longitude=min(bottom_left.longitude,top_right.longitude))
        largest = Location(latitude=max(bottom_left.latitude,top_right.latitude),
                           longitude=max(bottom_left.longitude,top_right.longitude))

        return f'{smallest.longitude},{smallest.latitude},{largest.longitude},{largest.latitude}'

    def url(self, autocomplete: bool = False) -> str: 
        '''Gets the full URL for a search query'''

        search = self._extract_city() if self.cities_only else self.search
        query = {"q": search, "access_token": KEY}
        # Exclude anything lower than a municipality:
        if self.cities_only:
            query['types'] = 'postcode,district,place'
        # Only use bounding box when not searching cities:
        else:
            query['bbox'] = self.bbox()

        # We use a try/catch here because tag() can crash unintentionally
        try:
            type = tag(self.search)[1]
            # The searchbox endpoint can't handle any address type in this list:
            assert type not in ['Intersection']
            query['auto_complete'] = 'true' if autocomplete else 'false'
            return f"{SEARCHBOX}/forward?{urlencode(query)}"
        except:
            query['autocomplete'] = 'true' if autocomplete else 'false'
            return f"{GEOCODE}/forward?{urlencode(query)}"

    def _extract_city(self):
        '''Extracts the city from a search
            * Throws a 400 if tag() fails or if missing PlaceName'''
        
        try:
            tagged = tag(self.search)
            # Ambiguous tags (short) prob won't have PII
            if tagged[1] == 'Ambiguous':
                return self.search

            search = tagged[0]['PlaceName']
            if 'StateName' in tagged[0]:
                search += ', ' + tagged[0]['PlaceName']
            if 'ZipCode' in tagged[0]:
                search += ' ' + tagged[0]['ZipCode']
            return search
        except:
            raise HTTPException(status_code=400,detail='This address is not a city')


def search(search: Search):
    '''Search Mapbox for a given query'''
    
    res = requests.get(search.url())
    if res.status_code != 200:
        print('\033[91m','\t[ERROR] search returned', res.status_code, '\033[0m')
        print(f'\t{res.json()['error']}')
        raise HTTPException(status_code=500)
    
    results = [SearchResult(r['properties']).dict() for r in json.loads(res.text)['features']]
    return {'results': results}

def autocomplete(search: Search):
    '''Attempt to autocomplete a partial search'''

    res = requests.get(search.url(autocomplete=True))
    if res.status_code != 200:
        print('\033[91m','\t[ERROR] autocomplete returned', res.status_code, '\033[0m')
        print(f'\t{res.json()['error']}')
        raise HTTPException(status_code=500, detail=res.text)
    
    suggestions = [{'placePrediction': AutocompleteResult(res['properties']).dict()} for res in json.loads(res.text)['features']]
    return {'suggestions': suggestions}

def reverse(location: Location, raw: bool = False):
    '''Given a LatLong, find the nearest locations'''

    query = urllib.parse.urlencode({
        'latitude': location.latitude,
        'longitude': location.longitude,
        'access_token': KEY
    })
    res = requests.get(f'{GEOCODE}/reverse?{query}')
    
    if res.status_code != 200:
        print('\033[91m','[ERROR] reverse returned', res.status_code, '\033[0m')
        print(f'\t{res.json()['error']}')
        raise HTTPException(status_code=500, detail=res.text)   
         
    if raw:
        return res.json()
        
    addresses = [Address(location,r['properties']).dict() for r in res.json()["features"]]
    return {"result": addresses}
