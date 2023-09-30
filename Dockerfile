FROM node:20-slim AS build

WORKDIR /app

COPY . .
RUN mv prod.env .env

RUN npm i
RUN npm i -g typescript

RUN tsc

CMD ["npm", "start"]