import json

# Load processed data
with open('processed_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create JavaScript content
js_content = f'window.DATA = {json.dumps(data, ensure_ascii=False, indent=2)};'

# Write to data.js
with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print('✅ Data copied to data.js successfully!')
print(f'File size: {len(js_content)} characters')
