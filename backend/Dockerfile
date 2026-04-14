# Образ без gcc/postgresql-client: зависимости ставятся из готовых wheels (меньше места при сборке).
# Если pip упадёт на компиляции — временно верните gcc + libffi-dev в отдельный stage.
FROM python:3.11-slim

WORKDIR /app

# Медленный/нестабильный канал до PyPI даёт таймауты (15 с по умолчанию) и пустой индекс пакетов.
ENV PIP_DEFAULT_TIMEOUT=120

RUN pip install --no-cache-dir --default-timeout=120 --retries 10 --upgrade pip wheel

COPY requirements.txt .

RUN pip install --no-cache-dir --default-timeout=120 --retries 10 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
