## Development
To spin up the development server outside of a Docker instance, run the following code:

```bash
cd server
pip install uv
uv sync
export CENTER_LAT=44.9713728 CENTER_LON=-93.2610879
export MAPS_URL=https://PDCdomain.goeshere
export MAPS_KEY=**api_key_here** 
uv run fastapi dev server.py
```