FROM node:22.14.0 AS build

WORKDIR /app

COPY package.json package-lock.json ./

# Sin NODE_ENV=production aquí: hace falta instalar devDependencies (tsc, vite)
RUN npm ci --legacy-peer-deps

COPY . .

# Debe coincidir con el proxy nginx: mismo origen + /api/v1
ARG VITE_CINE_API_URL=http://client-cine-upea.bo/api/v1
ENV VITE_CINE_API_URL=$VITE_CINE_API_URL

RUN npm run build -- --mode production

FROM nginxinc/nginx-unprivileged:1.28-alpine AS production

USER root

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx/frontend.conf /etc/nginx/conf.d/frontend.conf

COPY --from=build /app/dist /usr/share/nginx/html

USER nginx

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
