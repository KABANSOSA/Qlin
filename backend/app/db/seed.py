"""
Database seeding script.
"""
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from app.models.zone import Zone
from app.models.pricing_rule import PricingRule


def seed_database():
    """Seed database with initial data."""
    db: Session = SessionLocal()

    try:
        # Create admin user
        admin = db.query(User).filter(User.phone == "+79999999999").first()
        if not admin:
            admin = User(
                phone="+79999999999",
                email="admin@qlinpro.ru",
                first_name="Admin",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()

        # Create zones
        zones_data = [
            {
                "name": "Центральный округ",
                "city": "Москва",
                "base_price": 2000,
            },
            {
                "name": "Северный округ",
                "city": "Москва",
                "base_price": 1800,
            },
            {
                "name": "Южный округ",
                "city": "Москва",
                "base_price": 1800,
            },
        ]

        for zone_data in zones_data:
            zone = db.query(Zone).filter(Zone.name == zone_data["name"]).first()
            if not zone:
                zone = Zone(**zone_data)
                db.add(zone)
                db.commit()

                # Create pricing rules for zone
                for cleaning_type in ["regular", "deep", "move_in", "move_out"]:
                    rule = PricingRule(
                        zone_id=zone.id,
                        cleaning_type=cleaning_type,
                        base_price_per_room=500,
                        min_price=1500,
                        is_active=True,
                    )
                    db.add(rule)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
