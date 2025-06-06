#!/bin/bash

# Load environment variables from .env
set -a
source .env
set +a

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/reddit_clone_$TIMESTAMP.sql"

# Extract database connection details from DATABASE_URL
DB_NAME="reddit_clone"
DB_HOST="localhost"
DB_PORT="5435"

echo "Creating backup of database..."
pg_dump -h $DB_HOST -p $DB_PORT $DB_NAME > "$BACKUP_FILE"

# Keep only last 5 backups
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -I {} rm -- {}

echo "Backup completed: $BACKUP_FILE" 