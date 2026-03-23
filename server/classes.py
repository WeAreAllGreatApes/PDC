from pydantic import BaseModel
from utils import geo_distance


class Search(BaseModel):
    search: str
class Autocomplete(BaseModel):
    search: str
    
class ReverseSearch(BaseModel):
    latitude: float
    longitude: float

class StructuredAddress():
    regionCode: str
    languageCode: str
    postalCode: str
    administrativeArea: str
    locality: str
    addressLines: list[str]
    
    def __init__(self, addr):
        self.regionCode = addr['country']['country_code']
        # self.languageCode: <UNUSED / UNMAPPABLE>
        self.postalCode = addr['postcode']['name']
        self.administrativeArea = addr['region']['region_code']
        self.locality = addr['place']['name']
        self.addressLines = [addr['address']['name']]
        
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
    latitude: float
    longitude: float
    distance: float
    address: str
    structuredAddress: StructuredAddress
    
    def __init__(self, search: ReverseSearch, addr: dict):
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
            'structuredAddress': self.structuredAddress
        }
        return {k:v for k,v in D.items() if v is not None}
        
class SearchResult():    
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
            'location': {
                'lat': res['coordinates']['latitude'],
                'lng': res['coordinates']['longitude']
            }
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
    

class StructuredText:
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
    
class AutocompleteResult():
    placeId: str
    types: list[str]
    text: StructuredText
    structuredFormat: dict[str,StructuredText]
    match_code: dict[str,str]
    
    def __init__(self, res: dict):
        self.placeId = res['mapbox_id']
        self.types = [res['feature_type']]
        self.text = StructuredText(res['full_address'])
        self.structuredFormat = {
            'mainText': StructuredText(res['name_preferred'] if 'name_preferred' in res else res['name']),
            'secondaryText': StructuredText(res['place_formatted'])
        }
        if 'match_code' in res:
            self.match_code = res['match_code']
        
    def dict(self):
        D = {
            'placeId': self.placeId,
            'types': self.types,                
            'text': self.text.dict(),
            'structuredFormat': {k:v.dict() for k,v in self.structuredFormat.items()},
            'matchCode': self.match_code
        }
        return {k:v for k,v in D.items() if v is not None}
        