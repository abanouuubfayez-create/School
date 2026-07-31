with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin) {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري المعالجة...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري التحقق من النماذج المتاحة...</div>';

    fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.error) throw new Error("ListModels Error: " + data.error.message);
        var models = data.models || [];
        
        var flashModel = null;
        var pro15Model = null;
        var pro10Model = null;

        for(var i=0; i<models.length; i++) {
            var m = models[i];
            if(m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1) {
                if (m.name.indexOf('vision') !== -1) continue;
                if (m.name.indexOf('exp') !== -1) continue;
                
                if (!flashModel && m.name.indexOf('gemini-1.5-flash') !== -1) {
                    flashModel = m.name;
                } else if (!pro15Model && m.name.indexOf('gemini-1.5-pro') !== -1) {
                    pro15Model = m.name;
                } else if (!pro10Model && (m.name.indexOf('gemini-1.0-pro') !== -1 || m.name.indexOf('gemini-pro') !== -1)) {
                    pro10Model = m.name;
                }
            }
        }
        
        var selectedModels = [];
        if (flashModel) selectedModels.push(flashModel);
        if (pro10Model) selectedModels.push(pro10Model);
        if (pro15Model) selectedModels.push(pro15Model);

        if (selectedModels.length === 0) throw new Error("No supported text generation models found for this API key.");

        var lastErrorMsg = "";
        
        function tryModel(index) {
            if(index >= selectedModels.length) {
                resultBox.innerHTML = '<div style="color:red; font-size:14px; text-align:right;">❌ عذراً، فشل الاتصال. تفاصيل الخطأ:<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(lastErrorMsg) + '</strong></div>';
                btn.disabled = false;
                btn.innerHTML = btnOriginalText;
                return;
            }
            var targetModel = selectedModels[index];
            resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري إنشاء الرد... (' + targetModel.replace('models/','') + ')</div>';
            
            fetch('https://generativelanguage.googleapis.com/v1beta/' + targetModel + ':generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if(data.error) {
                    var errMsg = data.error.message || "";
                    if (errMsg.toLowerCase().indexOf('quota') !== -1 || errMsg.indexOf('429') !== -1) {
                        if (errMsg.indexOf('limit: 0') !== -1) {
                            resultBox.innerHTML = '<div style="color:#dc2626; font-size:15px; text-align:center; padding:15px; background-color:#fee2e2; border-radius:8px; border: 1px solid #f87171;">❌ <b>تم إيقاف مفتاح API الخاص بك من قِبل جوجل:</b><br>حسابك لا يملك أي رصيد مجاني (Limit: 0). يحدث هذا إذا كان حسابك في دولة لا تدعم الباقة المجانية (مثل أوروبا)، أو تم استنفاد الحصة بالكامل. <b>يجب إنشاء مفتاح جديد من حساب آخر يدعم الخطة المجانية، أو تفعيل الدفع في حسابك.</b></div>';
                        } else {
                            resultBox.innerHTML = '<div style="color:#eab308; font-size:15px; text-align:center; padding:15px; background-color:#fef08a; border-radius:8px; border: 1px solid #facc15;">⏳ <b>تنبيه:</b> لقد وصلت للحد الأقصى من الطلبات المجانية المسموحة في الدقيقة لمفتاح API الخاص بك.<br>يُرجى الانتظار لمدة <b>دقيقة واحدة</b> ثم المحاولة مجدداً.</div>';
                        }
                        btn.disabled = false;
                        btn.innerHTML = btnOriginalText;
                        return;
                    }
                    lastErrorMsg = targetModel + " Error: " + errMsg;
                    tryModel(index + 1);
                    return;
                }
                if(!data.candidates || !data.candidates[0].content) {
                    lastErrorMsg = targetModel + " returned empty response.";
                    tryModel(index + 1);
                    return;
                }
                btn.disabled = false;
                btn.innerHTML = btnOriginalText;
                var text = data.candidates[0].content.parts[0].text;
                
                var resultHTML = '';
                if(typeof marked !== 'undefined') {
                    resultHTML = marked.parse(text);
                } else {
                    resultHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
                }
                
                var actionsHTML = '<div style="margin-top:20px; padding-top:15px; border-top:1px solid #ccc; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">';
                actionsHTML += '<button onclick="share_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#2563eb; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-share-alt"></i> مشاركة</button>';
                actionsHTML += '<button onclick="download_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#f3f4f6; color:#1f2937; border:1px solid #d1d5db; border-radius:5px; cursor:pointer;"><i class="fa fa-file-text"></i> حفظ النص</button>';
                
                if (isAdmin) {
                    actionsHTML += '<button onclick="search_ai_content_on_google()" style="padding:8px 15px; font-size:14px; background-color:#4285F4; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-google"></i> البحث في جوجل</button>';
                    actionsHTML += '<button onclick="jump_to_upload_resource()" style="padding:8px 15px; font-size:14px; background-color:#10B981; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-upload"></i> إضافة للمكتبة</button>';
                }
                
                actionsHTML += '</div>';
                
                resultBox.innerHTML = resultHTML + actionsHTML;
                window._lastAiResultText = text;
            })
            .catch(function(err) {
                lastErrorMsg = "Fetch error: " + err.message;
                tryModel(index + 1);
            });
        }
        
        tryModel(0);
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        resultBox.innerHTML = '<div style="color:red; font-size:14px; text-align:right;">❌ خطأ أولي:<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(err.message) + '</strong></div>';
    });
};
"""

start_idx = content.find("function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin)")
end_idx = content.find("function copyToClipboardFallback()", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_func + '\n' + content[end_idx:]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced callGemini with limit:0 detection")
else:
    print(f"Could not find callGemini. start_idx={start_idx}, end_idx={end_idx}")
