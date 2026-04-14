#!/usr/bin/env bash
# Задать пароль для CRM: пользователь +79999999999 (после seed).
# Запуск из корня репозитория: ./scripts/set-crm-admin-password.sh 'ВашПарольОт8Символов'
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${1:-}" || ${#1} -lt 8 ]]; then
  echo "Использование: $0 'ПарольОт8Символов'" >&2
  exit 1
fi

export CRM_BOOTSTRAP_PW="$1"

docker compose -f docker-compose.prod.yml exec -e CRM_BOOTSTRAP_PW -T backend python <<'PY'
import os
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

p = os.environ["CRM_BOOTSTRAP_PW"].strip()
if len(p) < 8:
    raise SystemExit("Пароль не короче 8 символов")

db = SessionLocal()
try:
    u = db.query(User).filter(User.phone == "+79999999999").first()
    if not u:
        raise SystemExit("Нет пользователя +79999999999 — сначала: python -m app.db.seed")
    u.password_hash = get_password_hash(p)
    u.role = "admin"
    db.add(u)
    db.commit()
    print("OK: пароль установлен для +79999999999")
finally:
    db.close()
PY
