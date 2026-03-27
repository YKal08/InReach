# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Build-time env vars that Vite needs to bundle
ARG GOOGLE_MAPS_API_KEY
ENV GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY

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