FROM node:24-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM alpine AS export
COPY --from=build /app/dist /app/dist
CMD ["sh", "-c", "rm -rf /static/* && cp -r /app/dist/. /static/"]