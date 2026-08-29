FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @simulora/web... build

FROM nginx:1.28-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY deploy/containers/web.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
