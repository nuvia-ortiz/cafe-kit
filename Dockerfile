# Single-process image: Next.js server + SQLite file in /app/data (mount a volume there to keep data).
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
RUN mkdir -p data && chown node:node data
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
