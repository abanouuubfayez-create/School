def fix_prompt():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # The issue is the AI is forced to act as a career advisor even when asked about the company.
    # Let's add an explicit instruction right after "أنت مستشار مهني وتطوير موارد بشرية محترف."
    
    old_text = 'أنت مستشار مهني وتطوير موارد بشرية محترف. بناءً على المدخل التالي:'
    new_text = 'أنت مستشار مهني وتطوير موارد بشرية محترف. (هام جداً: إذا كان المستخدم يسأل عن معلومات الشركة أو مشاريعها أو موظفيها، أجب عليه مباشرة كأنك متحدث باسم الشركة ولا تقترح مساراً مهنياً إلا إذا طلب ذلك بوضوح). بناءً على المدخل التالي:'
    
    content = content.replace(old_text, new_text)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Prompt fixed.")

if __name__ == "__main__":
    fix_prompt()
