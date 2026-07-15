# Imagen de desarrollo del backend (ARCH-6.2, ARCH-6.3).
# El código se monta como volumen (compose.yaml) para el watch de Nest.
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

# Manifiestos primero para cachear la instalación.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY project/shared/package.json ./project/shared/
COPY project/backend/package.json ./project/backend/
COPY project/frontend/package.json ./project/frontend/

RUN pnpm install

COPY . .

EXPOSE 3000
CMD ["pnpm", "--filter", "@paleo/backend", "start:dev"]
