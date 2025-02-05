FROM node:22-alpine as build

# Build react app
WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

# Setup nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/argus.conf

COPY --from=build /app/build /opt/app

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]