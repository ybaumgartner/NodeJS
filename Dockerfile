FROM node:20-alpine AS build-crm

WORKDIR /app
COPY apps/crm/package*.json ./
RUN npm ci
COPY apps/crm/ ./
RUN npm run build

FROM node:20-alpine AS build-dashboard

WORKDIR /app
COPY apps/dashboard/package*.json ./
RUN npm ci
COPY apps/dashboard/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY portal/ /usr/share/nginx/html/
COPY --from=build-crm /app/build /usr/share/nginx/html/crm
COPY --from=build-dashboard /app/build /usr/share/nginx/html/dashboard

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
