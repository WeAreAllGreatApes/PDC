#!/bin/bash
# This file is for dev use *only*

sudo docker build --tag 'pdc' .
sudo docker run --publish 8000:8000 pdc