#!/usr/bin/env python3
"""
Check if admin user exists and password works
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, User
from app.utils.security import hash_password, verify_password

def main():
    print("Checking admin user in database...")
    print("-" * 50)
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        
        if admin:
            print(f"✅ Admin user found:")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Is Active: {admin.is_active}")
            print(f"   Password hash: {admin.hashed_password[:50]}...")
            
            # Test password verification
            print(f"\nTesting password 'admin':")
            test_hash = hash_password("admin")
            print(f"   Generated hash: {test_hash[:50]}...")
            print(f"   Hashes match: {test_hash == admin.hashed_password}")
            print(f"   Password verification: {verify_password('admin', admin.hashed_password)}")
        else:
            print("❌ Admin user not found in database!")
            print("Run: python init_db.py")
    finally:
        db.close()

if __name__ == "__main__":
    main()
