#!/bin/bash
# This file is for dev use *only*

sudo docker build --tag 'pdc' .
sudo docker run -p 8000:8000 pdc