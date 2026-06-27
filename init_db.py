import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.database import SessionLocal, engine, Base
from backend.src.services.auth import hash_password
from backend.src import models

def create_initial_admin():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin_exists = db.query(models.User).filter(models.User.username == "admin").first()
        if admin_exists:
            print("Администратор 'admin' уже существует в базе данных.")
            return

        super_user = models.User(
            username="admin",
            hashed_password=hash_password("admin"),
            role=models.UserRole.ADMIN
        )
        db.add(super_user)
        db.commit()
        print("\n------------------------------------\n")
        print("Пользователь 'admin' успешно создан!")
        print("\n------------------------------------\n")
        print("Данные для входа:\n\nИмя пользователя: admin\nПароль: admin")
        print("\n------------------------------------\n")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при инициализации базы данных: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_admin()
