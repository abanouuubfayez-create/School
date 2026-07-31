def update_app_js_prompts():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace all instances of `var prompt = "` with `var prompt = buildCompanyContextForAi() + "`
    content = content.replace('var prompt = "', 'var prompt = buildCompanyContextForAi() + "')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Successfully injected buildCompanyContextForAi() into prompts")

if __name__ == "__main__":
    update_app_js_prompts()
