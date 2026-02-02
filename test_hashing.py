from passlib.context import CryptContext
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("test")
    print(f"Hash: {hash}")
    verify = pwd_context.verify("test", hash)
    print(f"Verify: {verify}")
except Exception as e:
    print(f"Error: {e}")
