import re

with open('employee.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the devres styling issue
old_devres = """  <!-- التطوير المهني -->
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
    </div>"""

new_devres = """  <!-- التطوير المهني -->
  <div class="emp-pg" id="epg-devres">
    <div class="set-sec" style="background: linear-gradient(135deg, #1b2a4a 0%, #2a437a 100%); border: none; box-shadow: 0 10px 30px rgba(27,42,74,0.2); padding: 30px;">
      <div style="color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 24px; font-weight: 800; margin-bottom: 12px;">🚀 مسار التطوير المهني المخصص</div>
      <div style="color: rgba(255,255,255,0.9); font-size: 15px; margin-bottom: 24px; line-height: 1.6;">
        الذكاء الاصطناعي الخاص بتيك جو يساعدك في تخطيط مستقبلك المهني. أدخل تخصصك أو المهارة التي تود تطويرها وسنقترح لك خطة مصممة خصيصاً لك من مكتبتنا!
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <input type="text" id="devResEmpField" placeholder="مثال: مطور ويب، مسوق رقمي، محاسب، إدارة مشاريع..." style="flex: 1; padding: 14px 18px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.3) !important; background: rgba(0,0,0,0.2) !important; color: #fff !important; font-size: 16px; outline: none; transition: all 0.3s;" onfocus="this.style.background='rgba(0,0,0,0.3) !important';this.style.borderColor='var(--gd) !important';" onblur="this.style.background='rgba(0,0,0,0.2) !important';this.style.borderColor='rgba(255,255,255,0.3) !important';">
        <button class="bt bt-p" onclick="generateCareerPath()" style="padding: 14px 24px; font-size: 16px; font-weight: bold; background: var(--gd) !important; color: var(--nv) !important; border: none; box-shadow: 0 4px 15px rgba(201,162,39,0.4);" id="btnGeneratePath">✨ اقترح مساراً لي</button>
      </div>
    </div>"""

content = content.replace(old_devres, new_devres)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing contrast in employee.html")
