#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Start services in the background
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
docker-compose exec -T app sh -c "until nc -z db 5432; do sleep 1; done"

# Run database migrations with Drizzle
echo "Running database migrations..."
docker-compose exec -T app npm run db:migrate

# Create uploads directory if it doesn't exist
docker-compose exec -T app sh -c "mkdir -p /app/uploads"

# Set proper permissions
docker-compose exec -T app sh -c "chown -R node:node /app/uploads /app/logs"

echo "Deployment completed successfully!"
echo "Application is running at http://localhost:3000"
