#!/usr/bin/env python3
"""
Database Initialization Script
Creates all tables and default admin user
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, SessionLocal, create_default_admin

def main():
    print("🚀 Initializing K8s Dashboard Database...")
    print("-" * 50)
    
    try:
        # Initialize database schema
        print("Creating database tables...")
        init_db()
        print("✅ Database tables created successfully")
        
        # Create default admin user
        print("\nCreating default admin user...")
        db = SessionLocal()
        try:
            admin = create_default_admin(db)
            print(f"✅ Default admin user created:")
            print(f"   Username: {admin.username}")
            print(f"   Password: admin (CHANGE THIS IN PRODUCTION!)")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
        finally:
            db.close()
        
        print("\n" + "=" * 50)
        print("✅ Database initialization completed successfully!")
        print("=" * 50)
        print("\n📝 Next Steps:")
        print("1. Set ENCRYPTION_KEY environment variable")
        print("2. Start the backend: uvicorn app.main:app --reload")
        print("3. Login with admin/admin")
        print("4. Add your first Kubernetes cluster")
        print("\n⚠️  IMPORTANT: Change the admin password in production!")
        
    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
