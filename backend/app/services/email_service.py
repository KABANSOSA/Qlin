"""
Отправка писем (SMTP). Используется для сброса пароля.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_addresses: List[str],
    subject: str,
    body_plain: str,
    body_html: str,
) -> None:
    """Синхронная отправка письма через SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        raise RuntimeError("SMTP не настроен (SMTP_HOST / SMTP_FROM)")

    user = settings.SMTP_USER or ""
    password = settings.SMTP_PASSWORD or ""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = ", ".join(to_addresses)
    msg.attach(MIMEText(body_plain, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    host = settings.SMTP_HOST
    port = settings.SMTP_PORT

    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=30) as smtp:
            if user and password:
                smtp.login(user, password)
            smtp.sendmail(settings.SMTP_FROM, to_addresses, msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.ehlo()
            if settings.SMTP_USE_TLS:
                smtp.starttls()
                smtp.ehlo()
            if user and password:
                smtp.login(user, password)
            smtp.sendmail(settings.SMTP_FROM, to_addresses, msg.as_string())


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Письмо со ссылкой на сброс пароля."""
    subject = f"{settings.APP_NAME} — восстановление пароля"
    plain = (
        f"Здравствуйте.\n\n"
        f"Чтобы задать новый пароль, перейдите по ссылке:\n{reset_url}\n\n"
        f"Ссылка действует 1 час. Если вы не запрашивали сброс, проигнорируйте письмо.\n"
    )
    html = f"""\
<!DOCTYPE html>
<html><body style="font-family: sans-serif; line-height: 1.5;">
<p>Здравствуйте.</p>
<p>Чтобы задать новый пароль, нажмите:</p>
<p><a href="{reset_url}">{reset_url}</a></p>
<p style="color:#666;font-size:14px;">Ссылка действует 1 час. Если вы не запрашивали сброс, проигнорируйте письмо.</p>
</body></html>"""
    send_email([to_email], subject, plain, html)
