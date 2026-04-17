When deploying a instance of PDC, you must provide a mapbox API key to geocode locations. If no API key is provided, the python server may become unstable and the front-end will fall back on latitude and longitude.

# 1. Create a Mapbox API Key.

## a. Creating an Account

It is not difficult to create a mapbox account without providing personally identifiable information. You will need a VPN, an email that is not tied to a person, and a prepaid credit card. 

1. Navigate to www.mapbox.com
2. Follow the prompts to create an individual account
3. Enter a valid payment method: https://docs.mapbox.com/accounts/faq/how-do-i-pay-for-mapbox-services/
4. Complete email verification

## b. Creating an API Key

Log into mapbox.com and navigate to the tokens page.

You may use the default public token or create a project specific token. If you choose to create a custom token, ensure it has permission to make the following requests:
- Search Box API - Sessions
- Search Box API - Requests
- Temporary Geocoding API

## c. Cost

A deployment of PDC used by a small-to-medium sized team may not incur any cost from mapbox. Each month, the first 50,000 Search box requests and 100,000 Temporary Geocoding calls are free. Each additional 1,000 Temporary Geocoding calls cost $0.75.

www.mapbox.com/pricing#search

# 2. Pass mapbox API Key as an Environment Variable to Docker

Us one of the methods covered in  https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/ to set an environment variable called MAPS_KEY equal to the API key created in the last step.

An easy option is passing the key as a command line flag like:

```bash
docker run ... -e MAPS_KEY=api_key_here ...
```

# 3. Update Center Point to Improve Search Results

Please update the CENTER_LAT and CENTER_LON in the Dockerfile to an approximate center of your dispatch area. 

The server generates a 0.4 degree square bounding box around the center point (600-750 square miles). Results near the center point and in the bounding box are prioritized. However, results outside the bounding box will be returned if no close matches within bounding box exist.
