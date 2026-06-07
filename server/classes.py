from pydantic import BaseModel
from fastapi import HTTPException
from geopy.distance import distance
from usaddress import tag
from urllib.parse import urlencode
from utils import geo_distance
import environment as env

'''
Each class contained in this file is intended to translate Mapbox outputs
into Google-like outputs for the frontend to require minimal changes.
'''

class Location(BaseModel):
    '''Location (latitude/longitude)'''
    latitude: float
    longitude: float
    
    def max_compatibility(self):
        '''Returns an extremely compatible encoding of this class'''

        return {
            'lat': self.latitude,
            'latitude': self.latitude,
            'lon': self.longitude,
            'lng': self.longitude,
            'long': self.longitude,
            'longitude': self.longitude
        }

    def url(self):
        '''Builds a URL for a reverse search'''

        query = urlencode({
        'latitude': self.latitude,
        'longitude': self.longitude,
        'access_token': env.KEY
        })
        return f'{env.GEOCODE}/reverse?{query}'

class StructuredAddress():
    '''Emulator class for Google\'s `structuredAddress` field'''
    regionCode: str|None = None
    postalCode: str|None = None
    administrativeArea: str|None = None
    locality: str|None = None
    addressLines: list[str] = []
    
    def __init__(self, addr):
        if 'country' in addr:
            self.regionCode = addr['country']['country_code']
        if 'postcode' in addr:
            self.postalCode = addr['postcode']['name']
        if 'region' in addr:
            self.administrativeArea = addr['region']['region_code']
        if 'place' in addr: 
            self.locality = addr['place']['name']
        if 'address' in addr:
            self.addressLines.append(addr['address']['name'])
        
    def dict(self):
        D = {
            'regionCode': self.regionCode,
            'postalCode': self.postalCode,
            'adminsistrativeArea': self.administrativeArea,
            'locality': self.locality,
            'addressLines': self.addressLines,
        }
        return {k:v for k,v in D.items() if v is not None}

class Address():
    '''Basic address class (based on Google's address)'''                 
    latitude: float
    longitude: float
    distance: float
    address: str|None = None
    structuredAddress: StructuredAddress|None = None
    
    def __init__(self, search: Location, addr):
        self.latitude = addr['coordinates']['latitude']
        self.longitude = addr['coordinates']['longitude']
        self.distance = geo_distance(search.latitude, search.longitude, self.latitude, self.longitude)
        
        if 'full_address' in addr:
            self.address = addr['full_address']
        if "context" in addr:
            self.structuredAddress = StructuredAddress(addr['context'])
        
    def dict(self):
        D =  {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'distance': self.distance,
            'address': self.address,
        }
        if self.structuredAddress is not None:
            D['structuredAddress'] = self.structuredAddress.dict()
        
        return {k:v for k,v in D.items() if v is not None}
        
class StructuredText:
    '''Emulator class for Google\'s `structuredText` field'''
    text: str
    matches: list[dict[str,int]] | None
    
    def __init__(self, text: str, matches: list[dict[str,int]] | None = None):
        self.text = text
        self.matches = matches
    
    def dict(self):
        D = {
            'text': self.text,
            'matches': self.matches
        }
        return {k:v for k,v in D.items() if v is not None}

class Search(BaseModel):
    search: str
    center: Location | None = Location(latitude=env.DEFAULT_LAT,longitude=env.DEFAULT_LON)
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

        query = {
            "q": self._extract_city() if self.cities_only else self.search, 
            "access_token": env.KEY,
        }

        # Exclude anything lower than a municipality:
        if self.cities_only:
            query['types'] = 'postcode,district,place'
        # Only use bounding box when not searching cities:
        else:
            query['bbox'] = self.bbox()

        # We use a try/catch here because tag() can crash unintentionally
        try:
            type = tag(self.search)[1]
            # Geocoding needs unambiguous queries (see environment.py):
            assert type in env.UNAMBIGUOUS_TYPES
            query['autocomplete'] = 'true' if autocomplete else 'false'
            return f"{env.GEOCODE}/forward?{urlencode(query)}"
        except:
            query['auto_complete'] = 'true' if autocomplete else 'false'
            return f"{env.SEARCHBOX}/forward?{urlencode(query)}"

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

class SearchResult(): 
    '''Search results (entry in the array returned by `search()` in server.py)'''   
    address_components: list[dict]    
    formatted_address: str
    geometry: dict
    types: list[str]
    id: str
    
    def __init__(self, res: dict):
        self.id = res['mapbox_id']
        self.formatted_address = res['full_address'] if 'full_address' in res else res['name']
        self.geometry = {
            'location_type': res['feature_type'],
            'location': Location(
                latitude=res['coordinates']['latitude'],
                longitude=res['coordinates']['longitude']
            ).max_compatibility()
        }
        
        self.address_components = []
        for k,v in dict(res['context']).items():
            self.address_components.append({
                'long_name': v['name'],
                'name': v['name'],
                'types': [str(k).lower()]
            })
            
    def dict(self):
        D = {
            'id': self.id,
            'formatted_address': self.formatted_address,
            'geometry': self.geometry,
            'address_components': self.address_components
        }
        return {k:v for k,v in D.items() if v is not None}
    
class AutocompleteResult():
    '''Search results for the `autocomplete()` function in server.py'''
    placeId: str
    types: list[str]
    text: StructuredText
    structuredFormat: dict[str,StructuredText]
    match_code: dict[str,str]|None
    
    def __init__(self, res: dict):
        self.placeId = res['mapbox_id']
        self.types = [res['feature_type']]
        self.text = StructuredText(res['full_address'] if 'full_address' in res else res['name'])
        self.structuredFormat = {
            'mainText': StructuredText(res['name_preferred'] if 'name_preferred' in res else res['name']),
            'secondaryText': StructuredText(res['place_formatted'])
        }
        self.location = Location(
            latitude=res['coordinates']['latitude'],
            longitude=res['coordinates']['longitude'])
        
        self.match_code = None
        if 'match_code' in res:
            self.match_code = res['match_code']
        
    def dict(self):
        D = {
            'placeId': self.placeId,
            'types': self.types,                
            'text': self.text.dict(),
            'location': self.location.max_compatibility(),
            'structuredFormat': {k:v.dict() for k,v in self.structuredFormat.items()},
            'matchCode': self.match_code
        }
        return {k:v for k,v in D.items() if v is not None}
        