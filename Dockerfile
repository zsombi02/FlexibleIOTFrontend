FROM node:22-alpine AS builder

WORKDIR /app

COPY flexible-iot-frontend/package*.json ./

RUN npm ci

COPY flexible-iot-frontend/. .

RUN npm run build -- --configuration=production

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/flexible-iot-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
