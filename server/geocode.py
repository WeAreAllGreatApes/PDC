import json
from fastapi import HTTPException
import requests
from classes import Location, Search, SearchResult, AutocompleteResult, Address

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

    res = requests.get(location.url())    
    if res.status_code != 200:
        print('\033[91m','[ERROR] reverse returned', res.status_code, '\033[0m')
        print(f'\t{res.json()['error']}')
        raise HTTPException(status_code=500, detail=res.text)   
         
    if raw:
        return res.json()
        
    addresses = [Address(location,r['properties']).dict() for r in res.json()["features"]]
    return {"result": addresses}
