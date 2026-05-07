"""
Notification service for sending notifications.
"""
import logging
import secrets
from sqlalchemy.orm import Session
import httpx

from app.models.order import Order
from app.models.user import User
from app.models.cleaner import Cleaner
from app.models.notification import Notification
from app.models.push_device import PushDevice
from app.core.config import settings
from app.core.ipv4_outbound import force_ipv4_for_external_apis
from app.services.expo_push_service import push_to_user_ids


class NotificationService:
    """Service for sending notifications."""

    @staticmethod
    def _parse_comma_int_ids(raw: str, env_name: str) -> list[int]:
        out: list[int] = []
        for part in (raw or "").split(","):
            part = part.strip()
            if not part:
                continue
            try:
                out.append(int(part))
            except ValueError:
                logging.warning("%s: пропуск нечислового фрагмента %r", env_name, part)
        return out

    @staticmethod
    def notify_dispatch_new_order(db: Session, order: Order, source: str = "site") -> None:
        """
        Офису/диспетчеру при новом заказе: Telegram и/или VK (настраивается в .env).
        Telegram: DISPATCH_TELEGRAM_CHAT_IDS. VK: VK_COMMUNITY_TOKEN + DISPATCH_VK_PEER_IDS.
        """
        chat_ids = NotificationService._parse_comma_int_ids(
            settings.DISPATCH_TELEGRAM_CHAT_IDS or "", "DISPATCH_TELEGRAM_CHAT_IDS"
        )
        vk_peers = NotificationService._parse_comma_int_ids(
            settings.DISPATCH_VK_PEER_IDS or "", "DISPATCH_VK_PEER_IDS"
        )
        vk_token = (settings.VK_COMMUNITY_TOKEN or "").strip()

        logging.info(
            "notify_dispatch: заказ %s source=%s telegram_ids=%s vk_peers=%s vk_token_set=%s",
            getattr(order, "order_number", "?"),
            source,
            len(chat_ids),
            len(vk_peers),
            bool(vk_token),
        )

        if vk_peers and not vk_token:
            logging.warning(
                "notify_dispatch: DISPATCH_VK_PEER_IDS задан, но VK_COMMUNITY_TOKEN пуст — VK пропущен"
            )

        if not chat_ids and not vk_peers:
            logging.warning(
                "notify_dispatch: пропуск — не заданы DISPATCH_TELEGRAM_CHAT_IDS и DISPATCH_VK_PEER_IDS "
                "(проверьте env контейнера backend)"
            )
            return

        src = "CRM" if source == "crm" else "Сайт"
        addr = (order.address or "").strip()
        if len(addr) > 200:
            addr = addr[:197] + "…"
        total = getattr(order, "total_price", None)
        total_s = f"\nСумма: {total} ₽" if total is not None else ""
        text = f"📋 Новый заказ ({src})\n#{order.order_number}\n{addr}{total_s}"

        for cid in chat_ids:
            ok, err = NotificationService.send_telegram_message_result(chat_id=cid, text=text)
            if ok:
                logging.info("Dispatch Telegram: заказ %s → chat %s", order.order_number, cid)
            else:
                logging.warning(
                    "Dispatch Telegram: не доставлено, заказ %s → chat %s: %s",
                    order.order_number,
                    cid,
                    err,
                )

        if vk_peers and vk_token:
            vk_text = text if len(text) <= 4096 else text[:4093] + "…"
            for pid in vk_peers:
                ok, err = NotificationService.send_vk_dispatch_message_result(peer_id=pid, text=vk_text)
                if ok:
                    logging.info("Dispatch VK: заказ %s → peer %s", order.order_number, pid)
                else:
                    logging.warning(
                        "Dispatch VK: не доставлено, заказ %s → peer %s: %s",
                        order.order_number,
                        pid,
                        err,
                    )

    @staticmethod
    def notify_cleaners_new_order(db: Session, order: Order):
        """Notify all available cleaners about new order via Telegram bot."""
        try:
            # Get all available cleaners
            cleaners = (
                db.query(User)
                .join(Cleaner)
                .filter(
                    User.role == "cleaner",
                    User.is_active == True,
                    Cleaner.is_available == True,
                    User.telegram_id.isnot(None),
                )
                .all()
            )

            for cleaner in cleaners:
                notification = Notification(
                    user_id=cleaner.id,
                    type="order_available",
                    title="Новый заказ",
                    message=f"Доступен новый заказ #{order.order_number}",
                    related_order_id=order.id,
                )
                db.add(notification)

            if cleaners:
                db.commit()

            # Push в приложение (Expo) всем клинерам с зарегистрированным токеном
            try:
                cleaner_ids_push = (
                    db.query(User.id)
                    .join(PushDevice, PushDevice.user_id == User.id)
                    .filter(User.role == "cleaner", User.is_active.is_(True))
                    .distinct()
                    .all()
                )
                if cleaner_ids_push:
                    push_to_user_ids(
                        db,
                        [r[0] for r in cleaner_ids_push],
                        "Новый заказ",
                        f"Доступен заказ #{order.order_number}",
                        {"type": "new_order", "order_id": str(order.id)},
                    )
            except Exception as e:
                logging.exception("notify_cleaners_new_order push failed: %s", e)
        except Exception as e:
            # Заказ уже создан — не прерываем ответ API из-за уведомлений
            db.rollback()
            logging.exception("notify_cleaners_new_order failed: %s", e)

    @staticmethod
    def notify_customer_order_created(db: Session, order: Order):
        """Клиенту: заказ принят (push, запись в ленте, Telegram при привязке)."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_created",
                title="Заказ создан",
                message=f"Заказ #{order.order_number} принят. Ожидайте назначения уборщика.",
                related_order_id=order.id,
            )
            db.add(notification)
            db.commit()

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"✅ Заказ #{order.order_number} принят. Ожидайте назначения уборщика.",
                )

            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ создан",
                f"Заказ #{order.order_number} принят",
                {"type": "order_created", "order_id": str(order.id)},
            )
        except Exception as e:
            db.rollback()
            logging.exception("notify_customer_order_created failed: %s", e)

    @staticmethod
    def notify_order_assigned(db: Session, order: Order):
        """Notify customer that order was assigned."""
        notification = Notification(
            user_id=order.customer_id,
            type="order_assigned",
            title="Заказ назначен",
            message=f"Заказ #{order.order_number} назначен уборщику",
            related_order_id=order.id,
        )
        db.add(notification)
        db.commit()

        # Also send via Telegram if customer has telegram_id
        customer = db.query(User).filter(User.id == order.customer_id).first()
        if customer and customer.telegram_id:
            # Send message via Telegram Bot API
            NotificationService._send_telegram_message(
                chat_id=customer.telegram_id,
                text=f"✅ Заказ #{order.order_number} назначен уборщику",
            )

        try:
            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ назначен",
                f"Заказ #{order.order_number} назначен уборщику",
                {"type": "order_assigned", "order_id": str(order.id)},
            )
        except Exception as e:
            logging.exception("notify_order_assigned push failed: %s", e)

    @staticmethod
    def notify_customer_order_in_progress(db: Session, order: Order):
        """Клиенту: уборка началась."""
        try:
            push_to_user_ids(
                db,
                [order.customer_id],
                "Уборка началась",
                f"Заказ #{order.order_number} в работе",
                {"type": "in_progress", "order_id": str(order.id)},
            )
        except Exception as e:
            logging.exception("notify_customer_order_in_progress push failed: %s", e)

    @staticmethod
    def notify_customer_order_completed(db: Session, order: Order):
        """Клиенту: уборка завершена."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_completed",
                title="Уборка завершена",
                message=f"Заказ #{order.order_number} выполнен. Оцените качество и оплатите.",
                related_order_id=order.id,
            )
            db.add(notification)
            db.commit()

            push_to_user_ids(
                db,
                [order.customer_id],
                "Уборка завершена",
                f"Заказ #{order.order_number} выполнен. Можно оплатить.",
                {"type": "completed", "order_id": str(order.id)},
            )

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"✅ Заказ #{order.order_number} выполнен! Оцените уборку и оплатите в личном кабинете.",
                )
        except Exception as e:
            db.rollback()
            logging.exception("notify_customer_order_completed failed: %s", e)

    @staticmethod
    def notify_order_cancelled(db: Session, order: Order, cancelled_by: str):
        """Уведомить клиента и клинера (если назначен) об отмене заказа."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_cancelled",
                title="Заказ отменён",
                message=f"Заказ #{order.order_number} отменён.",
                related_order_id=order.id,
            )
            db.add(notification)

            if order.cleaner_id and cancelled_by != "cleaner":
                cleaner_notif = Notification(
                    user_id=order.cleaner_id,
                    type="order_cancelled",
                    title="Заказ отменён",
                    message=f"Заказ #{order.order_number} отменён клиентом.",
                    related_order_id=order.id,
                )
                db.add(cleaner_notif)

            db.commit()

            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ отменён",
                f"Заказ #{order.order_number} отменён",
                {"type": "cancelled", "order_id": str(order.id)},
            )

            if order.cleaner_id and cancelled_by != "cleaner":
                push_to_user_ids(
                    db,
                    [order.cleaner_id],
                    "Заказ отменён",
                    f"Заказ #{order.order_number} отменён клиентом",
                    {"type": "cancelled", "order_id": str(order.id)},
                )

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"❌ Заказ #{order.order_number} отменён.",
                )
        except Exception as e:
            db.rollback()
            logging.exception("notify_order_cancelled failed: %s", e)

    @staticmethod
    def vk_dispatch_api_check() -> tuple[bool, str]:
        """Проверка ключа сообщества (messages.getConversations)."""
        tok = (settings.VK_COMMUNITY_TOKEN or "").strip()
        if not tok:
            return False, "VK_COMMUNITY_TOKEN пуст"
        try:
            form = {
                "access_token": tok,
                "v": settings.VK_API_VERSION,
                "count": "1",
            }
            with force_ipv4_for_external_apis():
                with httpx.Client() as client:
                    response = client.post(
                        "https://api.vk.com/method/messages.getConversations",
                        data=form,
                        timeout=12.0,
                    )
            try:
                j = response.json() if response.content else {}
            except Exception:
                return False, (response.text or "")[:400]
            if not response.is_success:
                return False, f"HTTP {response.status_code}: {(response.text or '')[:300]}"
            if isinstance(j, dict) and "error" in j:
                err = j.get("error") or {}
                code = err.get("error_code", "?")
                msg = err.get("error_msg", "")
                return False, f"VK API {code}: {msg}"
            if isinstance(j, dict) and "response" in j:
                return True, "ok"
            return False, "unexpected response"
        except Exception as e:
            return False, str(e)[:400]

    @staticmethod
    def send_vk_dispatch_message_result(peer_id: int, text: str) -> tuple[bool, str]:
        """Личное сообщение от имени сообщества (messages.send)."""
        tok = (settings.VK_COMMUNITY_TOKEN or "").strip()
        if not tok:
            return False, "VK_COMMUNITY_TOKEN пуст"
        body = text if len(text) <= 4096 else text[:4093] + "…"
        try:
            form = {
                "peer_id": str(peer_id),
                "message": body,
                "random_id": str(secrets.randbelow(2**31)),
                "access_token": tok,
                "v": settings.VK_API_VERSION,
            }
            with force_ipv4_for_external_apis():
                with httpx.Client() as client:
                    response = client.post(
                        "https://api.vk.com/method/messages.send",
                        data=form,
                        timeout=15.0,
                    )
            try:
                j = response.json() if response.content else {}
            except Exception:
                return False, (response.text or "")[:400]
            if not response.is_success:
                return False, f"HTTP {response.status_code}: {(response.text or '')[:400]}"
            if isinstance(j, dict) and "error" in j:
                err = j.get("error") or {}
                code = err.get("error_code", "?")
                msg = err.get("error_msg", "")
                return False, f"VK API {code}: {msg}"
            if isinstance(j, dict) and "response" in j:
                return True, ""
            return False, str(j)[:400]
        except Exception as e:
            logging.warning("VK messages.send error: %s", e, exc_info=True)
            return False, str(e)[:400]

    @staticmethod
    def telegram_get_me() -> tuple[bool, str]:
        """Проверка токена бота (getMe). Возвращает (успех, @username или текст ошибки)."""
        try:
            url = f"{settings.TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/getMe"
            with force_ipv4_for_external_apis():
                with httpx.Client() as client:
                    response = client.get(url, timeout=10.0)
            try:
                data = response.json() if response.content else {}
            except Exception:
                return False, (response.text or "")[:400]
            if not response.is_success:
                return False, f"HTTP {response.status_code}: {(response.text or '')[:300]}"
            if isinstance(data, dict) and data.get("ok") is True:
                un = (data.get("result") or {}).get("username") or ""
                return True, f"@{un}" if un else "ok"
            if isinstance(data, dict):
                return False, str(data.get("description", data))[:500]
            return False, "unexpected response"
        except Exception as e:
            return False, str(e)[:400]

    @staticmethod
    def send_telegram_message_result(chat_id: int, text: str) -> tuple[bool, str]:
        """Отправка в Telegram: (успех, пусто или текст ошибки от API)."""
        try:
            url = f"{settings.TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            with force_ipv4_for_external_apis():
                with httpx.Client() as client:
                    response = client.post(
                        url,
                        json={
                            "chat_id": chat_id,
                            "text": text,
                        },
                        timeout=10.0,
                    )
            try:
                data = response.json() if response.content else {}
            except Exception:
                err = (response.text or "")[:400]
                logging.warning("Telegram response not JSON: %s", err)
                return False, err

            if not response.is_success:
                msg = f"HTTP {response.status_code}: {(response.text or '')[:400]}"
                logging.warning("Telegram HTTP error: %s", msg)
                return False, msg
            if isinstance(data, dict) and data.get("ok") is False:
                desc = str(data.get("description", data))
                logging.warning("Telegram sendMessage failed: %s", desc)
                return False, desc
            return True, ""
        except Exception as e:
            logging.warning("Telegram sendMessage error: %s", e, exc_info=True)
            return False, str(e)[:400]

    @staticmethod
    def _send_telegram_message(chat_id: int, text: str) -> bool:
        """Send message via Telegram Bot API."""
        ok, _ = NotificationService.send_telegram_message_result(chat_id, text)
        return ok
