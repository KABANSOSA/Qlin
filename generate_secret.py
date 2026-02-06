#!/usr/bin/env python3
"""
Генератор секретного ключа для проекта QLIN
"""
import secrets

# Генерируем секретный ключ длиной 32 байта (256 бит)
secret_key = secrets.token_urlsafe(32)

print("=" * 60)
print("Секретный ключ для SECRET_KEY:")
print("=" * 60)
print(secret_key)
print("=" * 60)
print(f"\nДлина: {len(secret_key)} символов")
print("\nСкопируйте этот ключ в файл .env:")
print(f"SECRET_KEY={secret_key}")
