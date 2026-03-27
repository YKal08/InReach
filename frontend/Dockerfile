# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN ./node_modules/.bin/react-router build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["./node_modules/.bin/react-router-serve", "./build/server/index.js"]