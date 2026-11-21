# SUMEXORA PENAL - Multi-stage production image
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache postgresql-client

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY database ./database

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Serve frontend static files from Express in production (extend index.ts if needed)
CMD ["node", "backend/dist/index.js"]
