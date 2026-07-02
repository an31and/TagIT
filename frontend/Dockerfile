# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build
WORKDIR /app

# yarn.lock* — the wildcard tolerates a missing lockfile (none is committed
# yet). Once you commit a yarn.lock, builds become reproducible automatically.
COPY package.json yarn.lock* ./
RUN yarn install

COPY . .
ARG REACT_APP_BACKEND_URL=http://localhost:8001
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build

# Lightweight static server
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
