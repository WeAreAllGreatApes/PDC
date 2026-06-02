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

    def url(self) -> str: 
        '''Gets the full URL for a search query'''
        search = self._extract_city() if self.cities_only else self.search
        query = urllib.parse.urlencode({"q": search,"bbox": self.bbox(),"access_token": KEY})
        # Exclude anything lower than a municipality:
        if self.cities_only:
            query += '&types=postcode,district,place'

        # We use a try/catch here because tag() can crash unintentionally
        try:
            type = tag(self.search)[1]
            assert type in ['Intersection']
            return f"{GEOCODE}/forward?{query}"
        except:
            return f"{SEARCHBOX}/forward?{query}"

    def _extract_city(self):
        '''Extracts the city from a search
            * Throws a 400 tag() fails or if missing PlaceName'''
        try:
            tagged = tag(self.search)
            if tagged[1] == 'Ambiguous': # Ambiguous tags (short) don't have
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

    res = requests.get(search.url())
    if res.status_code == 200:
        results = [SearchResult(r['properties']).dict() for r in json.loads(res.text)['features']]
        return {'results': results}
    else:
        print('\033[91m','[ERROR] search returned', res.status_code, '\033[0m')
        raise HTTPException(status_code=500)

def autocomplete(search: Search):
    
    res = requests.get(search.url() + '&autocomplete=true')
    
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
