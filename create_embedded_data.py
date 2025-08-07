import json
import random

# קריאת הנתונים המלאים
print("Loading data...")
with open('processed_data.json', 'r', encoding='utf-8') as f:
    full_data = json.load(f)

# יצירת גרסה מקוצרת של הנתונים
print("יוצר גרסה מקוצרת...")

# עיבוד הנתונים הקיימים
movies_sample = []

# נבדוק אם יש נתונים מעובדים כראוי
if 'barChartData' in full_data:
    print("משתמש בנתונים מעובדים קיימים...")
    # אין צורך במדגם - הנתונים כבר מעובדים
    embedded_data = full_data
else:
    print("נתונים לא מעובדים - נדרש עיבוד מחדש...")
    embedded_data = full_data

print("נתונים מוכנים לשימוש!")

# שמירה לקובץ JS
print("יוצר קובץ JS עם נתונים מוטמעים...")
js_content = f"""// נתוני IMDb מוטמעים
const EMBEDDED_DATA = {json.dumps(embedded_data, ensure_ascii=False, indent=2)};

// פונקציה להחלפת טעינת הנתונים
function getEmbeddedData() {{
    return Promise.resolve(EMBEDDED_DATA);
}}
"""

with open('embedded_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("✅ נתונים מוטמעים נוצרו בקובץ embedded_data.js")
print(f"גודל הקובץ: {len(js_content)} תווים") 