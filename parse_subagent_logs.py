with open(r'C:\Users\abano\.gemini\antigravity-ide\brain\a1b382d4-cf48-4dc7-8d21-a87a046899d3\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    text = f.read()

idx = 0
while True:
    idx = text.find("capture_browser_console_logs", idx)
    if idx == -1:
        break
    print(f"--- Found at {idx} ---")
    print(text[idx - 500 : idx + 2000])
    print("="*40)
    idx += 1
