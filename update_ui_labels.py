import os

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '🤖 الذكاء الاصطناعي (Gemini API)',
    '🤖 الذكاء الاصطناعي (Gemini / Groq / OpenRouter)'
)

content = content.replace(
    'ضع هنا مفتاح Gemini API لتفعيل اقتراحات التطوير المهني للموظفين.',
    'ضع هنا مفتاح API الخاص بك (Gemini أو Groq أو OpenRouter) لتفعيل اقتراحات التطوير المهني. النظام سيتعرف عليه تلقائياً.'
)

content = content.replace(
    'مفتاح Gemini API غير موجود في إعدادات النظام. يرجى إضافته أولاً.',
    'مفتاح الذكاء الاصطناعي غير موجود في إعدادات النظام. يرجى إضافة مفتاح (Gemini أو Groq أو OpenRouter) أولاً.'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI labels updated successfully!")
