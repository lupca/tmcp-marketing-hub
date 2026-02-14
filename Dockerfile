# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time env vars for Vite (baked into static JS)
# In K8s, marketing-hub uses relative paths through Ingress:
#   /pb/* → PocketBase
#   /api/agent/* → Agent API
ARG VITE_POCKETBASE_URL=""
ARG VITE_AGENTS_API_URL=""
ARG VITE_BASE_PATH="/hub/"

ENV VITE_BASE_PATH=${VITE_BASE_PATH}

RUN npm run build -- --base=${VITE_BASE_PATH}

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
