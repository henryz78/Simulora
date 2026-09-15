FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @simulora/api... build
RUN pnpm deploy --filter @simulora/api --prod --legacy /out

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SIMULORA_ENV=production
ENV SIMULORA_API_HOST=0.0.0.0
COPY --from=build /out ./
RUN rm -rf node_modules/@simulora node_modules/.pnpm/node_modules/@simulora
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
