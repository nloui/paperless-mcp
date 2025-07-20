# Builder stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app
COPY --from=builder /app/build .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

EXPOSE 3000
ENTRYPOINT [ "node", "index.js", "--http", "--port", "3000" ]
