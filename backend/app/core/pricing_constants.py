"""
Публичные правила расчёта (страница «Цены», форма заказа и бэкенд — одна логика).
"""
from decimal import Decimal

# База до 50 м² включительно
PUBLIC_BASE_PRICE_RUB = Decimal("3300")
PUBLIC_AREA_INCLUDED_SQ_M = Decimal("50")
PUBLIC_EXTRA_PER_SQ_M = Decimal("30")
# Если площадь не указана — оценка по числу комнат (как на фронте)
ESTIMATE_SQ_M_PER_ROOM = 25
