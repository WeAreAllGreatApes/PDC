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
        d = {
            'regionCode': self.regionCode,
            'postalCode': self.postalCode,
            'adminsistrativeArea': self.administrativeArea,
            'locality': self.locality,
            'addressLines': self.addressLines,
        }
        return {k:v for k,v in d.items() if v is not None}

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
        d =  {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'distance': self.distance,
            'address': self.address,
            'structuredAddress': self.structuredAddress
        }
        return {k:v for k,v in d.items() if v is not None}
