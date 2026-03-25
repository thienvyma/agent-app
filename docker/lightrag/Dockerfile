# LightRAG Service — Graph-Enhanced RAG
# Uses PostgreSQL backend (shared DB) + Ollama for embedding/extraction
# Port: 9621

FROM python:3.11-slim

WORKDIR /app

# Install curl for healthcheck + LightRAG with API server
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir \
      "lightrag-hku[api]" \
      asyncpg \
      psycopg2-binary

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Data directory for LightRAG
RUN mkdir -p /data

EXPOSE 9621

CMD ["/app/start.sh"]
