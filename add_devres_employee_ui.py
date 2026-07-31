import re

with open('employee.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't add it twice
if 'id="epg-devres"' not in content:
    devres_html = """
  <!-- التطوير المهني -->
  <div class="emp-pg" id="epg-devres">
    <div class="set-sec" style="background: linear-gradient(135deg, #1b2a4a 0%, #2a437a 100%); color: white; border: none; box-shadow: 0 10px 30px rgba(27,42,74,0.2);">
      <div class="set-sec-title" style="color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 24px;">🚀 مسار التطوير المهني المخصص</div>
      <div class="set-hint" style="color: rgba(255,255,255,0.85); font-size: 14px; margin-bottom: 20px;">
        الذكاء الاصطناعي الخاص بتيك جو يساعدك في تخطيط مستقبلك المهني. أدخل تخصصك أو المهارة التي تود تطويرها وسنقترح لك خطة مصممة خصيصاً لك من مكتبتنا!
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <input type="text" id="devResEmpField" placeholder="مثال: مطور ويب، مسوق رقمي، محاسب، إدارة مشاريع..." style="flex: 1; padding: 14px 18px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff; font-size: 16px; outline: none; transition: all 0.3s;" onfocus="this.style.background='rgba(255,255,255,0.2)';this.style.borderColor='var(--gd)';" onblur="this.style.background='rgba(255,255,255,0.1)';this.style.borderColor='rgba(255,255,255,0.2)';">
        <button class="bt bt-p" onclick="generateCareerPath()" style="padding: 14px 24px; font-size: 16px; font-weight: bold; background: var(--gd); color: var(--nv); border: none; box-shadow: 0 4px 15px rgba(201,162,39,0.4);" id="btnGeneratePath">✨ اقترح مساراً لي</button>
      </div>
    </div>

    <!-- AI Output Box -->
    <div id="aiPathResult" style="display:none; margin-top: 24px; padding: 24px; background: var(--w); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid var(--bd2); line-height: 1.8; font-size: 15px; color: var(--tx);">
      <!-- AI Content will be injected here -->
    </div>
    
    <div class="set-sec-title" style="margin-top: 30px; margin-bottom: 16px; font-size: 20px;">📚 تصفح مكتبة التطوير كاملة</div>
    <div id="empDevResGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
      <div class="empty-hint">⏳ جارٍ تحميل المصادر...</div>
    </div>
  </div>

  <div class="emp-pg" id="epg-acct">"""
    
    content = content.replace('  <div class="emp-pg" id="epg-acct">', devres_html)

    with open('employee.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Done adding devres to employee.html")
else:
    print("Already added")
