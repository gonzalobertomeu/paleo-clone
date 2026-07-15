# Imagen de desarrollo del frontend (ARCH-6.2, ARCH-6.3).
# El código se monta como volumen (compose.yaml) para el HMR de Vite.
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY project/shared/package.json ./project/shared/
COPY project/backend/package.json ./project/backend/
COPY project/frontend/package.json ./project/frontend/

RUN pnpm install

COPY . .

EXPOSE 5173
CMD ["pnpm", "--filter", "@paleo/frontend", "dev", "--host"]
