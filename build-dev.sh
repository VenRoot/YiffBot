#!/bin/bash

docker build -t dockerreg.m-loeffler.de/yiffbot:dev .
docker push dockerreg.m-loeffler.de/yiffbot:dev