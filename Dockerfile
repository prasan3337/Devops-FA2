
FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend

COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/server.js"]
