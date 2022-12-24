#!/bin/bash

# This script is used to release a new version of the project by scp the files to the server

# Get the server name from the argument
SERVER=$1

if [ -z "$SERVER" ]; then
    echo "Please provide the server name as the first argument"
    exit 1
fi

# Ask if the user is sure to release and if the §SERVER is correct, if not, exit
read -p "Are you sure to release to $SERVER? (y) " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborting"
    exit 1
fi

docker build -t dockerreg.$SERVER:443/yiffbot:latest .
docker push dockerreg.$SERVER:443/yiffbot:latest

echo "Releasing to $SERVER"

scp docker-compose.yml $SERVER:~/Applications/YiffBot/docker-compose.yml

ssh $SERVER "cd ~/Applications/YiffBot; sudo -S docker compose pull; sudo -S docker compose up -d"

echo "Done"

# # Push the files to the git repo
# git push

# # Pull the files from the git repo on the server
# ssh $SERVER "cd ~/Applications/YiffBot; git pull; docker build -t yiffbot .; docker compose up -d"