import os

'''
This file holds the server's environment-scoped variables
'''

# Map Key (input, required):
KEY = os.getenv("MAPS_KEY")
if KEY == None:
  with open(os.environ["MAPS_KEY_FILE"]) as f:
    KEY = f.read().strip()
assert KEY is not None

# Map URL (unused I think):
MAPS_URL = os.environ["MAPS_URL"]

'''
Searchbox costs more money, but it handles ambiguity and POIs well.
Geocode is dirt cheap, but it cannot handle POIs / ambiguity.

We recommend using Searchbox mainly, but augmenting it with the Geocode endpoint
to save costs when the input is unambiguous (see list below)
'''
SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1' # Good at POIs
GEOCODE = 'https://api.mapbox.com/search/geocode/v6' # Monetarily cheap
UNAMBIGUOUS_TYPES = ['Intersection']

# DEfault locations:
DEFAULT_LAT = float(os.environ["CENTER_LAT"])
DEFAULT_LON = float(os.environ["CENTER_LON"])