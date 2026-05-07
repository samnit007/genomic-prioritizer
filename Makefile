APP_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

.PHONY: up down rebuild logs reset ps shell-backend help

help:
	@echo ""
	@echo "  GenomePrioritizer — available commands"
	@echo ""
	@echo "  make up            Start app (build if needed)"
	@echo "  make down          Stop and remove containers"
	@echo "  make rebuild       Force rebuild all images then start"
	@echo "  make logs          Tail logs from all services"
	@echo "  make logs-backend  Tail backend logs only"
	@echo "  make logs-frontend Tail frontend logs only"
	@echo "  make ps            Show running containers"
	@echo "  make reset         Wipe database and reseed"
	@echo "  make shell-backend Open shell in backend container"
	@echo ""

up:
	@echo "→ Starting GenomePrioritizer..."
	cd $(APP_DIR) && docker compose up --build -d
	@echo ""
	@echo "  Frontend: http://localhost:8080"
	@echo "  API:      http://localhost:3000"
	@echo ""
	@echo "  Login: dr.chen / password123"
	@echo ""

down:
	@echo "→ Stopping GenomePrioritizer..."
	cd $(APP_DIR) && docker compose down

rebuild:
	@echo "→ Rebuilding all images..."
	cd $(APP_DIR) && docker compose down
	cd $(APP_DIR) && docker compose build --no-cache
	cd $(APP_DIR) && docker compose up -d

logs:
	cd $(APP_DIR) && docker compose logs -f

logs-backend:
	cd $(APP_DIR) && docker compose logs -f backend

logs-frontend:
	cd $(APP_DIR) && docker compose logs -f frontend

ps:
	cd $(APP_DIR) && docker compose ps

reset:
	@echo "→ Wiping database and reseeding..."
	cd $(APP_DIR) && docker compose down -v
	cd $(APP_DIR) && docker compose up --build -d
	@echo "→ Done. Data reset to seed state."

shell-backend:
	cd $(APP_DIR) && docker compose exec backend sh
