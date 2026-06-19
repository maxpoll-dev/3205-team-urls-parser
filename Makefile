.PHONY: up rebuild down

up:
	docker compose up -d

rebuild:
	docker compose up -d --build

down:
	docker compose down -v