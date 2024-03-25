FROM node:20-slim AS build
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm i -g typescript
RUN npm i

COPY . .

RUN tsc

CMD ["npm", "run", "start:prod"]