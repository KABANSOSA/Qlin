"""
Установить пароль для входа в CRM: пользователь +79999999999 (сида).

Запуск на сервере (пароль в кавычках, не короче 8 символов):

  docker compose -f docker-compose.prod.yml exec backend \\
    python -m app.db.set_crm_admin_password 'ВашНадёжныйПароль'

Пароль попадёт в историю shell — после смены выполните history -c или смените пароль в CRM.
"""
import sys

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

ADMIN_PHONE = "+79999999999"


def main() -> None:
    if len(sys.argv) < 2:
        print("Использование: python -m app.db.set_crm_admin_password 'ПарольОт8Символов'", file=sys.stderr)
        sys.exit(1)
    pwd = sys.argv[1].strip()
    if len(pwd) < 8:
        print("Пароль не короче 8 символов.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        u = db.query(User).filter(User.phone == ADMIN_PHONE).first()
        if not u:
            print(f"Пользователь {ADMIN_PHONE} не найден. Сначала: python -m app.db.seed", file=sys.stderr)
            sys.exit(1)
        u.password_hash = get_password_hash(pwd)
        if u.role != "admin":
            u.role = "admin"
        db.add(u)
        db.commit()
        print(f"OK: пароль установлен для {ADMIN_PHONE}, роль admin.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
