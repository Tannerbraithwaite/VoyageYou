#!/usr/bin/env python3
"""
Migration script to add location field to users table
"""
import sqlite3
import os

def migrate_add_location():
    """Add location column to users table"""
    db_path = 'travel_app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if location column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'location' in columns:
            print("✅ Location column already exists in users table")
            return True
        
        # Add location column
        print("🔧 Adding location column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN location TEXT")
        
        # Commit changes
        conn.commit()
        print("✅ Successfully added location column to users table")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'location' in columns:
            print("✅ Verification: location column is now in users table")
        else:
            print("❌ Verification failed: location column not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting migration to add location field...")
    success = migrate_add_location()
    
    if success:
        print("🎉 Migration completed successfully!")
    else:
        print("💥 Migration failed!")
        exit(1)
