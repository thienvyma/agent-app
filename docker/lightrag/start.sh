#!/bin/bash
set -e

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until python -c "import psycopg2; psycopg2.connect('${DATABASE_URL}')" 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL is ready!"

# Start LightRAG API server
exec python -m lightrag.api.serve \
  --host 0.0.0.0 \
  --port 9621 \
  --working-dir /data \
  --kv-storage PostgreSQLStorage \
  --doc-storage PostgreSQLStorage \
  --graph-storage PostgreSQLStorage \
  --vector-storage PostgreSQLStorage \
  --embedding-model nomic-embed-text \
  --llm-model qwen2.5:7b \
  --llm-binding ollama \
  --embedding-binding ollama \
  --ollama-host "${OLLAMA_URL:-http://192.168.1.35:8080}"
