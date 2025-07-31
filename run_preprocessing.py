#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
סקריפט הרצה לעיבוד נתוני IMDb
"""

import os
import sys
from data_preprocessing import IMDbDataProcessor

def check_files():
    """בדיקת קיום הקבצים הנדרשים"""
    required_files = [
        "title.basics.tsv/title.basics.tsv",
        "title.ratings.tsv/title.ratings.tsv"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ חסרים קבצים:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ כל הקבצים הנדרשים קיימים")
    return True

def main():
    print("🎬 מעבד נתוני IMDb לויזואליזציה")
    print("=" * 50)
    
    # בדיקת קבצים
    if not check_files():
        print("\n💡 ודא שהקבצים נמצאים בתיקיות הנכונות:")
        print("   - title.basics.tsv/title.basics.tsv")
        print("   - title.ratings.tsv/title.ratings.tsv")
        return
    
    # הרצת העיבוד
    processor = IMDbDataProcessor()
    data = processor.process_all_data()
    
    if data:
        print("\n🎉 העיבוד הושלם בהצלחה!")
        print(f"📊 נוצר קובץ: processed_data.json")
        print(f"📈 {data['metadata']['totalMovies']:,} סרטים")
        print(f"⭐ {data['metadata']['totalRatings']:,} דירוגים")
        print(f"🎭 {len(data['metadata']['genres'])} ז'אנרים")
        print("\n➡️  כעת ניתן לפתוח את index.html לצפייה בוויזואליזציה")
    else:
        print("\n❌ שגיאה בעיבוד")

if __name__ == "__main__":
    main() 