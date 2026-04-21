# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* bun.lockb* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  location / {' \
    '    try_files $uri $uri/ /index.html;' \
    '  }' \
    '  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {' \
    '    expires 7d;' \
    '    access_log off;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]