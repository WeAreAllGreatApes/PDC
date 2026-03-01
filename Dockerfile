FROM python:3.14.2-trixie@sha256:5ef4340ecf26915e4e782504641277a4f64e8ac1b9c467087bd6712d1e1cb9a7

COPY --from=docker.io/astral/uv:latest@sha256:143b40f4ab56a780f43377604702107b5a35f83a4453daf1e4be691358718a6a /uv /uvx /bin/

RUN mkdir -p /app/static

COPY server/pyproject.toml /app
RUN uv sync --directory /app

COPY index.html /app/static
COPY app.js /app/static
COPY lucide.min.js /app/static
COPY styles.css /app/static
COPY config.generated.js /app/static

COPY server/server.py /app

ENV MAPS_URL=https://PDCdomain.goeshere
ENV CENTER_LAT=44.9713728
ENV CENTER_LON=-93.2610879

ENTRYPOINT ["uv", "run", "--directory=/app", "fastapi", "run", "server.py"]
