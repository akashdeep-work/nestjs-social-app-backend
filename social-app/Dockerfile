FROM node:22-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm config set strict-ssl false
RUN npm ci --force

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm config set strict-ssl false
RUN npm ci --force

COPY . .

RUN npm run build
