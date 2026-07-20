FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Run the FastAPI server
# Cloud Run injects the PORT environment variable
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
