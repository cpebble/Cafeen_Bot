


build: src/*
	tsc -b
	docker build --tag cafeen_bot:latest .
