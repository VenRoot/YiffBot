FROM node:latest


# Create app directory
WORKDIR /app

# Install app dependencies
COPY . .
RUN mv prod.env .env

RUN npm install
RUN npm i -g typescript

CMD [ "npm", "start" ]