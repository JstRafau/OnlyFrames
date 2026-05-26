FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
 
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
RUN printf ':3000 {\n  root * /srv\n  try_files {path} /index.html\n  file_server\n  encode gzip\n}\n' > /etc/caddy/Caddyfile
EXPOSE 3000
 