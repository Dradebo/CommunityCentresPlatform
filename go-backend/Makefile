# Makefile placeholders for developing and deploying the Go backend

# Usage: replace placeholders when implementation starts

.PHONY: run build test migrate-up migrate-down lint tidy

run:
	# Run the server locally (after wiring main.go)
	# Example: go run ./cmd/server
	echo "Run the server here"

build:
	# Build a statically-linked binary suitable for containers
	# Example: CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/server ./cmd/server
	echo "Build the server here"

test:
	# Run unit and integration tests
	# Example: go test ./...
	echo "Run tests here"

migrate-up:
	# Apply database migrations
	# Example: migrate -path migrations -database $$DATABASE_URL up
	echo "Run migrate up here"

migrate-down:
	# Roll back database migrations
	# Example: migrate -path migrations -database $$DATABASE_URL down 1
	echo "Run migrate down here"

lint:
	# Run linters (golangci-lint or similar)
	echo "Run linters here"

tidy:
	# Keep go.mod/go.sum tidy
	# Example: go mod tidy
	echo "Tidy modules here"



