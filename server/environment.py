import os

'''
This file holds the server's environment-scoped variables
'''

# Initialization
KEY = os.getenv("MAPS_KEY")
if KEY == None:
  with open(os.environ["MAPS_KEY_FILE"]) as f:
    KEY = f.read().strip()
# URLs:
MAPS_URL = os.environ["MAPS_URL"]
SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1'
GEOCODE = 'https://api.mapbox.com/search/geocode/v6'

# DEfault locations:
DEFAULT_LAT = float(os.environ["CENTER_LAT"])
DEFAULT_LON = float(os.environ["CENTER_LON"])