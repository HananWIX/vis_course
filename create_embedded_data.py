import json
import random

# קריאת הנתונים המלאים
print("Loading data...")
with open('processed_data.json', 'r', encoding='utf-8') as f:
    full_data = json.load(f)

# יצירת גרסה מקוצרת של הנתונים
print("יוצר גרסה מקוצרת...")

# מדגמים חלק מהסרטים כדי להקטין את הגודל
movies_sample = []
for movie in full_data['movies']:
    # שומרים סרטים עם דירוג גבוה או מסוגי ז'אנר מעניינים
    if (movie.get('averageRating', 0) >= 7.0 or 
        movie.get('numVotes', 0) >= 10000 or 
        random.random() < 0.1):  # מדגם של 10%
        movies_sample.append(movie)

# מגבילים ל-5000 סרטים
movies_sample = movies_sample[:5000]

print(f"מספר סרטים במדגם: {len(movies_sample)}")

# יצירת נתונים מקוצרים
embedded_data = {
    'movies': movies_sample,
    'metadata': {
        'totalMovies': len(movies_sample),
        'totalRatings': len([m for m in movies_sample if m.get('averageRating')]),
        'mergedRecords': len(movies_sample),
        'yearRange': full_data['metadata']['yearRange'],
        'genres': full_data['metadata']['genres']
    }
}

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