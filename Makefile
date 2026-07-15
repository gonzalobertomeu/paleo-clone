# Router de comandos de docker compose (ARCH-2.7, ARCH-6.4).
# Único punto de entrada para operar el entorno local: no se ejecutan
# comandos de docker compose a mano. Targets fijados en ARCH-6.7.

COMPOSE := docker compose -f infra/compose.yaml

.PHONY: up down build logs sh test

up: ## Levanta todos los servicios (ARCH-6.7)
	$(COMPOSE) up -d

down: ## Para y limpia
	$(COMPOSE) down

build: ## Reconstruye las imágenes
	$(COMPOSE) build

logs: ## Logs de todos los servicios
	$(COMPOSE) logs -f

sh: ## Abre una shell en un servicio: make sh s=backend
	$(COMPOSE) exec $(s) sh

test: ## Ejecuta los tests (ARCH-8)
	$(COMPOSE) run --rm backend pnpm -r test
