// ─────────────────────────────────────────────────────────────────────────
// إرسال نموذج لموظف — الأدمن يبني نموذجاً بحقول مخصصة ويرسله لموظف مُحدَّد،
// الموظف يملأه من بوابته ويبعته تاني، والأدمن يشوف الرد فور وصوله.
// يعتمد على مجموعة Firestore: formRequests (راجع firestore.rules)
// يُحمَّل بعد app.js مباشرة في index.html و employee.html — لا يعدّل app.js
// ─────────────────────────────────────────────────────────────────────────
(function () {
  if (window.__fsInit) return;
  window.__fsInit = true;

  // أسماء مقترحة تطابق نماذج الأدمن الموجودة فعلاً — الأدمن يقدر يكتب أي اسم تاني بحرية
  var FS_SUGGESTED = [
    'إقرار بيانات موظف', 'طلب استقالة', 'إقرار استلام عهدة', 'استبيان رضا وظيفي',
    'تحديث البيانات الشخصية', 'إقرار الاطلاع على سياسة', 'نموذج تقييم ذاتي'
  ];
  var FS_FIELD_TYPES = { text: 'نص قصير', textarea: 'نص طويل', date: 'تاريخ', number: 'رقم' };

  // قوالب جاهزة مطابقة لحقول النماذج الرسمية الموجودة في app.js فقط
  // ملاحظة: تم حذف fclr / asset / jobreceipt / eval لأنها ليست موجودة في النظام الرسمي
  var FS_TEMPLATES = {
    emp: {
      title: 'ملف بيانات الموظف',
      fields: [
        { id: 'name',       label: 'الاسم الكامل',           type: 'text' },
        { id: 'nid',        label: 'الرقم القومي',            type: 'text' },
        { id: 'birthDate',  label: 'تاريخ الميلاد',           type: 'date' },
        { id: 'nationality',label: 'الجنسية',                 type: 'text' },
        { id: 'marital',    label: 'الحالة الاجتماعية',       type: 'text' },
        { id: 'phone',      label: 'رقم الهاتف',              type: 'tel'  },
        { id: 'email',      label: 'البريد الإلكتروني',       type: 'email'},
        { id: 'address',    label: 'العنوان',                  type: 'text' },
        { id: 'jobTitle',   label: 'المسمى الوظيفي',          type: 'text' },
        { id: 'dept',       label: 'القسم / الإدارة',         type: 'text' },
        { id: 'hireDate',   label: 'تاريخ التعيين',           type: 'date' },
        { id: 'empId',      label: 'الرقم الوظيفي',           type: 'text' },
        { id: 'contractType',label:'نوع العقد',               type: 'text' },
        { id: 'manager',    label: 'المدير المباشر',          type: 'text' }
      ]
    },
    leave: {
      title: 'نموذج طلب إجازة',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'phone', label: 'رقم التواصل أثناء الإجازة', type: 'tel' },
        { id: 'leaveType', label: 'نوع الإجازة', type: 'select', options: ['إجازة سنوية (م.١٢٤)', 'إجازة عارضة (م.١٢٨)', 'إجازة رسمية / أعياد (م.١٢٩)'] },
        { id: 'fromDate', label: 'تاريخ البدء', type: 'date' },
        { id: 'toDate', label: 'تاريخ الانتهاء', type: 'date' },
        { id: 'days', label: 'عدد الأيام', type: 'number' },
        { id: 'reason', label: 'سبب الإجازة', type: 'text' },
        { id: 'substitute', label: 'البديل أثناء الغياب', type: 'text' }
      ]
    },
    perm: {
      title: 'إذن حضور / انصراف',
      fields: [
        { id: 'permType', label: 'نوع الإذن', type: 'select', options: ['حضور بعد مواعيد العمل', 'انصراف قبل مواعيد العمل'] },
        { id: 'name', label: 'اسم الموظف', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'date', label: 'التاريخ', type: 'date' },
        { id: 'officialTime', label: 'الموعد الرسمي', type: 'time' },
        { id: 'actualTime', label: 'الحضور / الانصراف الفعلي', type: 'time' },
        { id: 'diff', label: 'مدة الفارق', type: 'text' },
        { id: 'reason', label: 'السبب', type: 'textarea' }
      ]
    },
    delay: {
      title: 'التماس تعديل موعد الحضور',
      fields: [
        { id: 'name', label: 'اسم الموظف الكامل', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'phone', label: 'رقم التواصل', type: 'tel' },
        { id: 'date', label: 'التاريخ', type: 'date' },
        { id: 'currentTime', label: 'موعد الحضور الرسمي الحالي', type: 'time' },
        { id: 'proposedTime', label: 'الموعد المقترح بعد التعديل', type: 'time' },
        { id: 'reason', label: 'سبب طلب التعديل', type: 'textarea' }
      ]
    },
    res: {
      title: 'نموذج طلب استقالة',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'hireDate', label: 'تاريخ التعيين', type: 'date' },
        { id: 'submitDate', label: 'تاريخ تقديم الطلب', type: 'date' },
        { id: 'lastDay', label: 'آخر يوم عمل مقترح', type: 'date' },
        { id: 'noticeDays', label: 'مدة الإشعار (بالأيام)', type: 'text' },
        { id: 'reason', label: 'سبب تقديم الاستقالة (اختياري)', type: 'textarea' }
      ]
    },
    compsug: {
      title: 'نموذج شكاوى ومقترحات',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'date', label: 'التاريخ', type: 'date' },
        { id: 'complaints', label: 'الشكاوى', type: 'textarea' },
        { id: 'suggestions', label: 'المقترحات', type: 'textarea' }
      ]
    },
    fclr: {
      title: 'نموذج إخلاء طرف',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'hireDate', label: 'تاريخ التعيين', type: 'date' },
        { id: 'lastDay', label: 'آخر يوم عمل فعلي', type: 'date' },
        { id: 'clearanceReason', label: 'سبب إخلاء الطرف', type: 'select', options: ['استقالة', 'انتهاء فترة العقد', 'إنهاء خدمة', 'نقل قسم / فرع آخر', 'أخرى'] },
        { id: 'assetsHandover', label: 'تسليم العهد والأجهزة والممتلكات', type: 'select', options: ['تم التسليم بالكامل وبحالة جيدة', 'جاري التسليم', 'لا يوجد عهد مسلمة'] },
        { id: 'handoverPerson', label: 'الموظف المستلم للمهام والعهد', type: 'text' },
        { id: 'financialStatus', label: 'المستحقات والالتزامات المالية', type: 'select', options: ['خالي الطرف مالياً 100%', 'توجد مستحقات/التزامات تحت التسوية'] },
        { id: 'notes', label: 'ملاحظات إضافية والتفاصيل', type: 'textarea' }
      ]
    },
    clr: {
      title: 'إخلاء طرف',
      noteSection: '٥',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'hireDate', label: 'تاريخ التعيين', type: 'date' },
        { id: 'lastDay', label: 'آخر يوم عمل فعلي', type: 'date' },
        { id: 'clearanceReason', label: 'سبب إخلاء الطرف', type: 'select', options: ['استقالة', 'انتهاء فترة العقد', 'إنهاء خدمة', 'نقل قسم / فرع آخر', 'أخرى'] },
        { id: 'assetsHandover', label: 'تسليم العهد والأجهزة والممتلكات', type: 'select', options: ['تم التسليم بالكامل وبحالة جيدة', 'جاري التسليم', 'لا يوجد عهد مسلمة'] },
        { id: 'handoverPerson', label: 'الموظف المستلم للمهام والعهد', type: 'text' },
        { id: 'financialStatus', label: 'المستحقات والالتزامات المالية', type: 'select', options: ['خالي الطرف مالياً 100%', 'توجد مستحقات/التزامات تحت التسوية'] },
        { id: 'notes', label: 'ملاحظات إضافية والتفاصيل', type: 'textarea' }
      ],
      fill: function () {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgIn('الاسم بالكامل', 'name'), fgIn('الرقم الوظيفي', 'empId'));
        h += F3(fgIn('القسم / الإدارة', 'dept'), fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('تاريخ آخر يوم عمل', 'lastDay', 'date'));
        h += SC('٢', 'إقرار وتسليم متعلقات');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          '<label><input type="checkbox" data-fid="chk1"> تم تسليم العهدة المالية</label>' +
          '<label><input type="checkbox" data-fid="chk2"> تم تسليم العهدة العينية (لابتوب، هاتف، الخ)</label>' +
          '<label><input type="checkbox" data-fid="chk3"> تم تسليم المستندات والملفات</label>' +
          '<label><input type="checkbox" data-fid="chk4"> تم إنهاء المهام المعلقة</label>' +
          '</div>';
        h += '<div class="fg fg-full"><label>ملاحظات إضافية (أو نواقص)</label><textarea rows="2" data-fid="reason"></textarea></div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgOut('الاسم بالكامل', v.name), fgOut('الرقم الوظيفي', v.empId));
        h += F3(fgOut('القسم / الإدارة', v.dept), fgOut('المسمى الوظيفي', v.jobTitle), fgOut('تاريخ آخر يوم عمل', v.lastDay));
        h += SC('٢', 'إقرار وتسليم متعلقات');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          '<label><input type="checkbox" disabled ' + (v.chk1 ? 'checked' : '') + '> تم تسليم العهدة المالية</label>' +
          '<label><input type="checkbox" disabled ' + (v.chk2 ? 'checked' : '') + '> تم تسليم العهدة العينية (لابتوب، هاتف، الخ)</label>' +
          '<label><input type="checkbox" disabled ' + (v.chk3 ? 'checked' : '') + '> تم تسليم المستندات والملفات</label>' +
          '<label><input type="checkbox" disabled ' + (v.chk4 ? 'checked' : '') + '> تم إنهاء المهام المعلقة</label>' +
          '</div>';
        h += fgOut('ملاحظات إضافية', v.reason, true);
        h += SC('٣', 'الإقرار المالي (الإدارة المالية)');
        h += fsStatusBlock();
        h += SC('٤', 'التوقيعات');
        h += SG3('توقيع الموظف', 'مقدم الإخلاء', 'المدير الإداري', 'استلام العهد', 'المدير التنفيذي', 'اعتماد نهائي', null, 'admin', 'exec');
        return h;
      }
    },
    eval: {
      title: 'تقييم أداء ذاتي',
      noteSection: '٥',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'period', label: 'فترة التقييم (من - إلى)', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'achievements', label: 'أبرز إنجازاتك خلال هذه الفترة', type: 'textarea' },
        { id: 'challenges', label: 'أبرز التحديات أو الصعوبات', type: 'textarea' },
        { id: 'proposals', label: 'مقترحات التطوير أو التدريب المطلوب', type: 'textarea' },
        { id: 'score1', label: 'تقييم جودة العمل (من 10)', type: 'number' },
        { id: 'score2', label: 'تقييم الالتزام بالمواعيد (من 10)', type: 'number' }
      ],
      fill: function () {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgIn('الاسم بالكامل', 'name'), fgIn('القسم / الإدارة', 'dept'));
        h += F2(fgIn('فترة التقييم (من - إلى)', 'period'), fgIn('المسمى الوظيفي', 'jobTitle'));
        h += SC('٢', 'التقييم الذاتي');
        h += '<div class="fg fg-full"><label>أبرز إنجازاتك خلال هذه الفترة</label><textarea rows="3" data-fid="achievements"></textarea></div>';
        h += '<div class="fg fg-full"><label>أبرز التحديات أو الصعوبات</label><textarea rows="2" data-fid="challenges"></textarea></div>';
        h += '<div class="fg fg-full"><label>مقترحات التطوير أو التدريب المطلوب</label><textarea rows="2" data-fid="proposals"></textarea></div>';
        h += SC('٣', 'التقييم الرقمي الذاتي');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          '<label>جودة العمل: <input type="number" min="1" max="10" data-fid="score1" placeholder="/ 10" style="width:60px"></label>' +
          '<label>الالتزام بالمواعيد: <input type="number" min="1" max="10" data-fid="score2" placeholder="/ 10" style="width:60px"></label>' +
          '</div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgOut('الاسم بالكامل', v.name), fgOut('القسم / الإدارة', v.dept));
        h += F2(fgOut('فترة التقييم', v.period), fgOut('المسمى الوظيفي', v.jobTitle));
        h += SC('٢', 'التقييم الذاتي');
        h += fgOut('أبرز إنجازاتك خلال هذه الفترة', v.achievements, true);
        h += fgOut('أبرز التحديات أو الصعوبات', v.challenges, true);
        h += fgOut('مقترحات التطوير أو التدريب المطلوب', v.proposals, true);
        h += SC('٣', 'التقييم الرقمي الذاتي');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          fgOut('جودة العمل', (v.score1||'0')+'/10') +
          fgOut('الالتزام بالمواعيد', (v.score2||'0')+'/10') +
          '</div>';
        h += SC('٤', 'اعتماد المدير المباشر');
        h += fsStatusBlock();
        h += '<div style="margin-top:16px">'+SG3('توقيع الموظف', '', 'المدير المباشر', '', 'المدير الإداري', 'اعتماد', null, 'admin', 'exec')+'</div>';
        return h;
      }
    },
    salrec: {
      title: 'سند استلام راتب',
      noteSection: '٥',
      fields: [
        { id: 'name', label: 'الاسم بالكامل', type: 'text' },
        { id: 'empId', label: 'الرقم الوظيفي', type: 'text' },
        { id: 'dept', label: 'القسم / الإدارة', type: 'text' },
        { id: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { id: 'period', label: 'عن شهر / فترة', type: 'text' },
        { id: 'payMethod', label: 'طريقة الصرف', type: 'select', options: ['نقداً (Cash)', 'تحويل بنكي (Bank Transfer)', 'شيك (Cheque)', 'محفظة إلكترونية (E-Wallet)'] },
        { id: 'basicSal', label: 'الراتب الأساسي', type: 'number' },
        { id: 'allowances', label: 'البدلات والعلاوات', type: 'number' },
        { id: 'bonuses', label: 'المكافآت والحوافز (+)', type: 'number' },
        { id: 'deductions', label: 'الاستقطاعات والخصومات (-)', type: 'number' },
        { id: 'netSal', label: 'صافي المبلغ المستلم', type: 'number' },
        { id: 'notes', label: 'ملاحظات إضافية', type: 'textarea' }
      ],
      fill: function () {
        var h = SC('١', 'بيانات الموظف والدفع');
        h += F2(fgIn('الاسم بالكامل', 'name'), fgIn('الرقم الوظيفي', 'empId'));
        h += F3(fgIn('القسم / الإدارة', 'dept'), fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('عن شهر / فترة', 'period'));
        h += F2(fgIn('طريقة الصرف', 'payMethod'), fgIn('الراتب الأساسي', 'basicSal', 'number'));
        h += SC('٢', 'المستحقات والاستقطاعات');
        h += F3(fgIn('البدلات والعلاوات', 'allowances', 'number'), fgIn('المكافآت والحوافز', 'bonuses', 'number'), fgIn('الاستقطاعات والخصومات (-)', 'deductions', 'number'));
        h += F2(fgIn('صافي المبلغ المستلم', 'netSal', 'number'), fgIn('ملاحظات إضافية', 'notes'));
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف والدفع');
        h += F2(fgOut('الاسم بالكامل', v.name), fgOut('الرقم الوظيفي', v.empId));
        h += F3(fgOut('القسم / الإدارة', v.dept), fgOut('المسمى الوظيفي', v.jobTitle), fgOut('عن شهر / فترة', v.period));
        h += F2(fgOut('طريقة الصرف', v.payMethod), fgOut('الراتب الأساسي', v.basicSal));
        h += SC('٢', 'المستحقات والاستقطاعات');
        h += F3(fgOut('البدلات والعلاوات', v.allowances), fgOut('المكافآت والحوافز', v.bonuses), fgOut('الاستقطاعات والخصومات', v.deductions));
        h += F2(fgOut('صافي المبلغ المستلم', v.netSal), fgOut('ملاحظات إضافية', v.notes));
        h += SC('٣', 'اعتماد الإدارة المالية والتوقيعات');
        h += fsStatusBlock();
        h += '<div style="margin-top:16px">'+SG3('توقيع المستلم (الموظف)', '', 'مسؤول المالية', '', 'اعتماد المدير التنفيذي', 'اعتماد نهائي', null, 'admin', 'exec')+'</div>';
        return h;
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // نفس تصميم النماذج الرسمية (H/SC/F2/F3/SG3 من app.js) — لضمان أن يكون
  // النموذج اللي يملأه الموظف، والنسخة اللي يطبعها الأدمن، هو نفس تصميم
  // النموذج الرسمي الموجود في مكتبة الأوراق (مش نموذج شبيه مبني بشكل عام).
  // ─────────────────────────────────────────────────────────────────────
  function fgIn(label, fid, type) {
    return '<div class="fg"><label>' + escH(label) + '</label><input type="' + (type || 'text') + '" data-fid="' + fid + '"></div>';
  }
  function fgOut(label, value, full) {
    return '<div class="fg' + (full ? ' fg-full' : '') + '"><label>' + escH(label) + '</label>' +
      '<input type="text" value="' + escH(value || '—') + '" readonly></div>';
  }
  function fsRadioIn(fid, name, value, label) {
    return '<label><input type="radio" name="' + name + '" data-fid="' + fid + '" value="' + escH(value) + '"> ' + label + '</label>';
  }
  function fsRadioOut(value, checkedValue, label) {
    return '<label><input type="radio" disabled' + (value === checkedValue ? ' checked' : '') + '> ' + label + '</label>';
  }
  function fsStatusBlock() {
    return '<div class="stg"><button type="button" class="stb ok" onclick="ts(this)">✅ موافق</button>' +
      '<button type="button" class="stb no" onclick="ts(this)">❌ مرفوض</button>' +
      '<button type="button" class="stb pn a" onclick="ts(this)">⏳ معلق</button></div>';
  }

  var FS_OFFICIAL_META = {
    emp:  { sub: 'للاستخدام الداخلي فقط', en: 'EMPLOYEE FILE' },
    leave: { sub: 'اللائحة التنظيمية — المادة الثالثة', en: 'LEAVE REQUEST' },
    perm: { sub: 'اللائحة التنظيمية — المادة الثالثة', en: 'ATTENDANCE PERMISSION' },
    delay: { sub: 'طلب تعديل موعد الحضور الرسمي بصفة دائمة', en: 'ATTENDANCE DELAY REQUEST' },
    res: { sub: 'وفق اللائحة التنظيمية — إشعار إنهاء الخدمة', en: 'RESIGNATION REQUEST' }
  };

  var FS_OFFICIAL = {
    emp: {
      noteSection: '٣',
      fill: function () {
        var h = SC('١', 'البيانات الشخصية');
        h += F2(fgIn('الاسم الكامل', 'name'), fgIn('الرقم القومي', 'nid'));
        h += F3(fgIn('تاريخ الميلاد', 'birthDate', 'date'), fgIn('الجنسية', 'nationality'), fgIn('الحالة الاجتماعية', 'marital'));
        h += F2(fgIn('رقم الهاتف', 'phone', 'tel'), fgIn('البريد الإلكتروني', 'email', 'email'));
        h += '<div class="fg fg-full"><label>العنوان</label><input type="text" data-fid="address"></div>';
        h += SC('٢', 'بيانات الوظيفة');
        h += F2(fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('القسم / الإدارة', 'dept'));
        h += F3(fgIn('تاريخ التعيين', 'hireDate', 'date'), fgIn('الرقم الوظيفي', 'empId'), fgIn('نوع العقد', 'contractType'));
        h += F2(fgIn('المدير المباشر', 'manager'), fgIn('درجة الوظيفة', 'grade'));
        return h;
      },
      print: function (v) {
        var h = SC('١', 'البيانات الشخصية');
        h += F2(fgOut('الاسم الكامل', v.name), fgOut('الرقم القومي', v.nid));
        h += F3(fgOut('تاريخ الميلاد', v.birthDate), fgOut('الجنسية', v.nationality), fgOut('الحالة الاجتماعية', v.marital));
        h += F2(fgOut('رقم الهاتف', v.phone), fgOut('البريد الإلكتروني', v.email));
        h += fgOut('العنوان', v.address, true);
        h += SC('٢', 'بيانات الوظيفة');
        h += F2(fgOut('المسمى الوظيفي', v.jobTitle), fgOut('القسم / الإدارة', v.dept));
        h += F3(fgOut('تاريخ التعيين', v.hireDate), fgOut('الرقم الوظيفي', v.empId), fgOut('نوع العقد', v.contractType));
        h += F2(fgOut('المدير المباشر', v.manager), fgOut('درجة الوظيفة', v.grade));
        h += SC('٣', 'التوقيعات');
        h += SG3('توقيع الموظف', '', 'المدير الإداري / مدير المشروعات', '', 'المدير التنفيذي', 'اعتماد', null, 'admin', 'exec');
        return h;
      }
    },
    leave: {
      noteSection: '٧',
      fill: function () {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgIn('الاسم بالكامل', 'name'), fgIn('القسم / الإدارة', 'dept'));
        h += F2(fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('رقم التواصل أثناء الإجازة', 'phone', 'tel'));
        h += SC('٢', 'نوع الإجازة');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr 1fr">' +
          fsRadioIn('leaveType', 'fsLt', 'إجازة سنوية (م.١٢٤)', '<strong>إجازة سنوية</strong> (م.١٢٤)') +
          fsRadioIn('leaveType', 'fsLt', 'إجازة عارضة (م.١٢٨)', '<strong>إجازة عارضة</strong> (م.١٢٨)') +
          fsRadioIn('leaveType', 'fsLt', 'إجازة رسمية / أعياد (م.١٢٩)', '<strong>إجازة رسمية</strong> (م.١٢٩)') + '</div>';
        h += SC('٣', 'مدة الإجازة');
        h += F3(fgIn('تاريخ البدء', 'fromDate', 'date'), fgIn('تاريخ الانتهاء', 'toDate', 'date'), fgIn('عدد الأيام', 'days', 'number'));
        h += SC('٤', 'سبب الإجازة والبديل');
        h += '<div class="fg fg-full"><label>سبب الإجازة</label><input type="text" data-fid="reason"></div>';
        h += '<div class="fg fg-full"><label>البديل أثناء الغياب</label><input type="text" data-fid="substitute"></div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgOut('الاسم بالكامل', v.name), fgOut('القسم / الإدارة', v.dept));
        h += F2(fgOut('المسمى الوظيفي', v.jobTitle), fgOut('رقم التواصل أثناء الإجازة', v.phone));
        h += SC('٢', 'نوع الإجازة');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr 1fr">' +
          fsRadioOut(v.leaveType, 'إجازة سنوية (م.١٢٤)', '<strong>إجازة سنوية</strong> (م.١٢٤)') +
          fsRadioOut(v.leaveType, 'إجازة عارضة (م.١٢٨)', '<strong>إجازة عارضة</strong> (م.١٢٨)') +
          fsRadioOut(v.leaveType, 'إجازة رسمية / أعياد (م.١٢٩)', '<strong>إجازة رسمية</strong> (م.١٢٩)') + '</div>';
        h += SC('٣', 'مدة الإجازة');
        h += F3(fgOut('تاريخ البدء', v.fromDate), fgOut('تاريخ الانتهاء', v.toDate), fgOut('عدد الأيام', v.days));
        h += SC('٤', 'سبب الإجازة والبديل');
        h += fgOut('سبب الإجازة', v.reason, true);
        h += fgOut('البديل أثناء الغياب', v.substitute, true);
        h += SC('٥', 'حالة الطلب');
        h += fsStatusBlock();
        h += SC('٦', 'التوقيعات');
        h += SG3('توقيع الموظف', '', 'المدير الإداري / مدير المشروعات', 'الموافقة', 'المدير التنفيذي', 'الاعتماد النهائي', null, 'admin', 'exec');
        return h;
      }
    },
    perm: {
      noteSection: '٥',
      fill: function () {
        var h = SC('١', 'نوع الإذن');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          fsRadioIn('permType', 'fsPt', 'حضور بعد مواعيد العمل', '<strong>حضور</strong> بعد مواعيد العمل') +
          fsRadioIn('permType', 'fsPt', 'انصراف قبل مواعيد العمل', '<strong>انصراف</strong> قبل مواعيد العمل') + '</div>';
        h += SC('٢', 'بيانات الموظف');
        h += F2(fgIn('اسم الموظف', 'name'), fgIn('الرقم الوظيفي', 'empId'));
        h += F2(fgIn('القسم / الإدارة', 'dept'), fgIn('التاريخ', 'date', 'date'));
        h += SC('٣', 'تفاصيل الإذن');
        h += F3(fgIn('الموعد الرسمي', 'officialTime', 'time'), fgIn('الحضور/الانصراف الفعلي', 'actualTime', 'time'), fgIn('مدة الفارق', 'diff'));
        h += '<div class="fg fg-full"><label>السبب</label><textarea rows="2" data-fid="reason"></textarea></div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'نوع الإذن');
        h += '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' +
          fsRadioOut(v.permType, 'حضور بعد مواعيد العمل', '<strong>حضور</strong> بعد مواعيد العمل') +
          fsRadioOut(v.permType, 'انصراف قبل مواعيد العمل', '<strong>انصراف</strong> قبل مواعيد العمل') + '</div>';
        h += SC('٢', 'بيانات الموظف');
        h += F2(fgOut('اسم الموظف', v.name), fgOut('الرقم الوظيفي', v.empId));
        h += F2(fgOut('القسم / الإدارة', v.dept), fgOut('التاريخ', v.date));
        h += SC('٣', 'تفاصيل الإذن');
        h += F3(fgOut('الموعد الرسمي', v.officialTime), fgOut('الحضور/الانصراف الفعلي', v.actualTime), fgOut('مدة الفارق', v.diff));
        h += fgOut('السبب', v.reason, true);
        h += SC('٤', 'التوقيعات');
        h += SG3('توقيع الموظف', '', 'المدير الإداري', 'الموافقة', 'المدير التنفيذي', '', null, 'admin', 'exec');
        return h;
      }
    },
    delay: {
      noteSection: '٥',
      fill: function () {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgIn('اسم الموظف الكامل', 'name'), fgIn('الرقم الوظيفي', 'empId'));
        h += F2(fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('القسم / الإدارة', 'dept'));
        h += F2(fgIn('رقم التواصل', 'phone', 'tel'), fgIn('التاريخ', 'date', 'date'));
        h += SC('٢', 'تفاصيل الالتماس');
        h += F2(fgIn('موعد الحضور الرسمي الحالي', 'currentTime', 'time'), fgIn('الموعد المقترح بعد التعديل', 'proposedTime', 'time'));
        h += '<div class="fg fg-full"><label>سبب طلب التعديل</label><textarea rows="3" data-fid="reason"></textarea></div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgOut('اسم الموظف الكامل', v.name), fgOut('الرقم الوظيفي', v.empId));
        h += F2(fgOut('المسمى الوظيفي', v.jobTitle), fgOut('القسم / الإدارة', v.dept));
        h += F2(fgOut('رقم التواصل', v.phone), fgOut('التاريخ', v.date));
        h += SC('٢', 'تفاصيل الالتماس');
        h += F2(fgOut('موعد الحضور الرسمي الحالي', v.currentTime), fgOut('الموعد المقترح بعد التعديل', v.proposedTime));
        h += fgOut('سبب طلب التعديل', v.reason, true);
        h += SC('٣', 'قرار الإدارة');
        h += fsStatusBlock();
        h += SC('٤', 'التوقيعات');
        h += SG3('توقيع الموظف', 'مقدم الالتماس', 'المدير الإداري / مدير المشروعات', 'اعتماد وتوثيق', 'المدير التنفيذي', 'الموافقة النهائية', null, 'admin', 'exec');
        return h;
      }
    },
    res: {
      noteSection: '٦',
      fill: function () {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgIn('الاسم بالكامل', 'name'), fgIn('الرقم الوظيفي', 'empId'));
        h += F3(fgIn('القسم / الإدارة', 'dept'), fgIn('المسمى الوظيفي', 'jobTitle'), fgIn('تاريخ التعيين', 'hireDate', 'date'));
        h += SC('٢', 'تفاصيل الاستقالة');
        h += F3(fgIn('تاريخ تقديم الطلب', 'submitDate', 'date'), fgIn('آخر يوم عمل مقترح', 'lastDay', 'date'), fgIn('مدة الإشعار (بالأيام)', 'noticeDays'));
        h += '<div class="fg fg-full"><label>سبب تقديم الاستقالة (اختياري)</label><textarea rows="3" data-fid="reason"></textarea></div>';
        return h;
      },
      print: function (v) {
        var h = SC('١', 'بيانات الموظف');
        h += F2(fgOut('الاسم بالكامل', v.name), fgOut('الرقم الوظيفي', v.empId));
        h += F3(fgOut('القسم / الإدارة', v.dept), fgOut('المسمى الوظيفي', v.jobTitle), fgOut('تاريخ التعيين', v.hireDate));
        h += SC('٢', 'تفاصيل الاستقالة');
        h += F3(fgOut('تاريخ تقديم الطلب', v.submitDate), fgOut('آخر يوم عمل مقترح', v.lastDay), fgOut('مدة الإشعار (بالأيام)', v.noticeDays));
        h += fgOut('سبب تقديم الاستقالة', v.reason, true);
        h += SC('٣', 'الإقرار');
        h += '<div class="wb wb-gd">أقر أنا الموقّع أدناه برغبتي في إنهاء خدمتي، وأتعهد بتسليم كافة العُهد والمستندات الخاصة بالعمل قبل تاريخ آخر يوم عمل.</div>';
        h += SC('٤', 'حالة الطلب');
        h += fsStatusBlock();
        h += SC('٥', 'التوقيعات');
        h += SG3('توقيع الموظف', 'مقدم الطلب', 'المدير الإداري / مدير المشروعات', 'استلام ومراجعة', 'المدير التنفيذي', 'الموافقة النهائية', null, 'admin', 'exec');
        return h;
      }
    }
  };

  var fsEmployees = [];
  var fsFieldSeq = 0;
  var fsSentCache = [];

  // ══════════════════════════ جهة الأدمن (index.html) ══════════════════════════
  var fsEmployees = [];
  var fsFieldSeq = 0;
  var fsIncomingCache = [];
  window.fsFilterStatus = 'all';

  // ══════════════════════════ جهة الأدمن (index.html) ══════════════════════════
  window.goSendForm = function (nav, targetUid, templateTitle) {
    document.querySelectorAll('.S-i').forEach(function (e) { e.classList.remove('a'); });
    if (nav) { nav.classList.add('a'); }
    document.querySelectorAll('.pg').forEach(function (e) { e.classList.remove('a'); });
    var c = document.getElementById('pg-sendform');
    if (!c) return;
    c.classList.add('a');
    var pT = document.getElementById('pT');
    if (pT) pT.innerText = 'صندوق النماذج والطلبات';
    if (window.innerWidth <= 900) {
      var sb = document.getElementById('sb');
      if (sb) sb.classList.remove('opn');
    }
    if (!c.dataset.mounted) {
      fsRenderAdminShell(c);
      fsLoadEmployees();
      fsWatchIncomingRequests();
      c.dataset.mounted = '1';
    }
    if (targetUid) {
      fsToggleSendFormBuilder(true);
      setTimeout(function(){
          var sel = document.getElementById('fsTargetEmp');
          if (sel) sel.value = targetUid;
          if (templateTitle) {
              var parsedTitle = templateTitle;
              var m = templateTitle.match(/النموذج المطلوب:\s*(.+?)(?:\n|$)/);
              if (m) parsedTitle = m[1].trim();
              
              var tpl = document.getElementById('fsTemplateKey');
              if (tpl) {
                  if (parsedTitle.indexOf('نموذج مخصص') > -1) {
                      tpl.value = 'custom';
                  } else {
                      for (var k in FS_TEMPLATES) {
                          if (FS_TEMPLATES[k].title === parsedTitle) {
                              tpl.value = k;
                              break;
                          }
                      }
                  }
                  if (typeof fsOnTemplateChange === 'function') fsOnTemplateChange();
              }
          }
      }, 500);
    }
  };

  window.fsToggleSendFormBuilder = function (forceShow) {
    var panel = document.getElementById('fsBuilderPanel');
    if (!panel) return;
    if (forceShow === true) {
      panel.style.display = 'block';
    } else {
      panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'block' : 'none';
    }
  };

  window.fsSetFilterStatus = function (status) {
    window.fsFilterStatus = status;
    var btnAll = document.getElementById('fsFilterBtn_all');
    var btnPen = document.getElementById('fsFilterBtn_pending');
    var btnApp = document.getElementById('fsFilterBtn_approved');
    var btnRej = document.getElementById('fsFilterBtn_rejected');

    if (btnAll) btnAll.className = (status === 'all') ? 'bt bt-p' : 'bt bt-o';
    if (btnPen) btnPen.className = (status === 'pending') ? 'bt bt-p' : 'bt bt-o';
    if (btnApp) btnApp.className = (status === 'approved') ? 'bt bt-p' : 'bt bt-o';
    if (btnRej) btnRej.className = (status === 'rejected') ? 'bt bt-p' : 'bt bt-o';

    fsRenderIncomingInbox();
  };

  function fsRenderAdminShell(c) {
    var suggestOpts = FS_SUGGESTED.map(function (s) { return '<option value="' + escH(s) + '">'; }).join('');
    var tplOpts = '<option value="custom">✏️ نموذج مخصص (حقول حرة)</option>' +
      Object.keys(FS_TEMPLATES).map(function (k) {
        return '<option value="' + k + '">' + escH(FS_TEMPLATES[k].title) + '</option>';
      }).join('');

    c.innerHTML =
      '<div class="set-sec">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px; border-bottom:1.5px solid var(--bd); padding-bottom:14px;">' +
          '<div>' +
            '<h2 style="font-size:22px; font-weight:900; color:var(--tx); margin:0 0 4px;">📩 صندوق البريد والطلبات الواردة (Inbox)</h2>' +
            '<p style="color:var(--tx2); font-size:13.5px; margin:0; font-weight:600;">متابعة جميع طلبات ونماذج الموظفين الواردة من "طلباتي" والموافقة/الرفض المباشر وتصديرها.</p>' +
          '</div>' +
          '<button type="button" onclick="fsToggleSendFormBuilder()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:13.5px; padding:10px 20px; border-radius:30px; box-shadow:0 4px 15px rgba(16,185,129,0.3); border:none; cursor:pointer;">' +
            '➕ إرسال نموذج مخصص لموظف' +
          '</button>' +
        '</div>' +

        '<!-- Collapsible Form Builder (Admin to Employee) -->' +
        '<div id="fsBuilderPanel" style="display:none; background:var(--bg); border:1.5px solid var(--bd); padding:20px; border-radius:18px; margin-bottom:20px;">' +
          '<div class="set-sec-title">📝 إنشاء نموذج جديد وإرساله للموظف</div>' +
          '<div class="set-hint" style="margin-bottom:10px">اختر نموذجاً جاهزاً بنفس حقول النظام الرسمية، أو ابنِ نموذجاً مخصصاً بحقولك الخاصة.</div>' +
          '<div class="fr fr2">' +
            '<div class="fg"><label>نوع النموذج</label><select id="fsTemplateKey" onchange="fsOnTemplateChange()">' + tplOpts + '</select></div>' +
            '<div class="fg"><label>الموظف المستهدف</label><select id="fsTargetEmp"><option value="">اختر موظفاً...</option></select></div>' +
          '</div>' +
          '<div class="fg fg-full" id="fsCustomTitleWrap" style="margin-top:4px;display:none">' +
            '<label>اسم النموذج</label><input type="text" id="fsTitle" list="fsSuggestDL" placeholder="مثلاً: استبيان رضا وظيفي">' +
          '</div>' +
          '<datalist id="fsSuggestDL">' + suggestOpts + '</datalist>' +
          '<div class="fg fg-full" style="margin-top:4px"><label>ملاحظة للموظف (اختياري)</label><textarea id="fsNote" rows="2"></textarea></div>' +
          '<div style="margin-top:10px" id="fsCustomFieldsWrap">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
              '<label style="font-size:11.5px;font-weight:700;color:var(--tx2)">حقول النموذج</label>' +
              '<button type="button" class="bt bt-o" style="padding:4px 10px;font-size:11px" onclick="fsAddField()">➕ إضافة حقل</button>' +
            '</div>' +
            '<div id="fsFieldsBox"></div>' +
          '</div>' +
          '<div id="fsTplPreview" style="margin-top:10px;display:none"></div>' +
          '<button class="bt bt-p" style="margin-top:14px" onclick="fsSendForm()">📨 إرسال النموذج للموظف</button>' +
          '<div id="fsMsg" style="font-size:11px;margin-top:8px"></div>' +
        '</div>' +

        '<!-- Filter Switcher Bar for Incoming Inbox -->' +
        '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; align-items:center;">' +
          '<button type="button" onclick="fsSetFilterStatus(\'all\')" id="fsFilterBtn_all" class="bt bt-p" style="font-size:13px; font-weight:900; padding:8px 18px; border-radius:20px;">📩 جميع الطلبات الواردة</button>' +
          '<button type="button" onclick="fsSetFilterStatus(\'pending\')" id="fsFilterBtn_pending" class="bt bt-o" style="font-size:13px; font-weight:800; padding:8px 18px; border-radius:20px;">⏳ قيد الانتظار</button>' +
          '<button type="button" onclick="fsSetFilterStatus(\'approved\')" id="fsFilterBtn_approved" class="bt bt-o" style="font-size:13px; font-weight:800; padding:8px 18px; border-radius:20px;">✅ المقبولة والمعتمدة</button>' +
          '<button type="button" onclick="fsSetFilterStatus(\'rejected\')" id="fsFilterBtn_rejected" class="bt bt-o" style="font-size:13px; font-weight:800; padding:8px 18px; border-radius:20px;">❌ المرفوضة</button>' +
        '</div>' +

        '<div id="fsSentList">' +
          '<div style="text-align:center; padding:35px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل البريد الوارد...</div>' +
        '</div>' +
      '</div>';

    fsOnTemplateChange();
  }

  // يبدّل واجهة الأدمن بين القالب الجاهز (معاينة فقط) والنموذج المخصص (بانِي حقول حر)
  window.fsOnTemplateChange = function () {
    var sel = document.getElementById('fsTemplateKey');
    var key = sel ? sel.value : 'custom';
    var customTitleWrap = document.getElementById('fsCustomTitleWrap');
    var customFieldsWrap = document.getElementById('fsCustomFieldsWrap');
    var preview = document.getElementById('fsTplPreview');
    if (key === 'custom') {
      customTitleWrap.style.display = 'block';
      customFieldsWrap.style.display = 'block';
      preview.style.display = 'none';
      var box = document.getElementById('fsFieldsBox');
      if (box && !box.children.length) fsAddField();
    } else {
      customTitleWrap.style.display = 'none';
      customFieldsWrap.style.display = 'none';
      preview.style.display = 'block';
      var tpl = FS_TEMPLATES[key];
      var fHtml = '';
      if (tpl.fields) {
        fHtml = tpl.fields.map(function (f) { return '<label style="cursor:default">▫ ' + escH(f.label) + '</label>'; }).join('');
      } else {
        fHtml = '<div style="color:var(--tx3);grid-column:1/-1">هذا النموذج يستخدم تصميماً خاصاً.</div>';
      }
      preview.innerHTML = '<div class="set-hint" style="margin-bottom:6px">حقول هذا النموذج (مطابقة للنظام الرسمي):</div>' +
        '<div class="chk-grid" style="grid-template-columns:1fr 1fr">' + fHtml + '</div>';
    }
  };

  window.fsAddField = function () {
    var box = document.getElementById('fsFieldsBox');
    if (!box) return;
    var fid = 'fsf' + (++fsFieldSeq);
    var row = document.createElement('div');
    row.className = 'fr fr3';
    row.id = fid;
    row.style.marginTop = '6px';
    row.innerHTML =
      '<div class="fg"><input type="text" placeholder="تسمية الحقل (مثلاً: السبب)" data-role="label"></div>' +
      '<div class="fg"><select data-role="type">' +
        Object.keys(FS_FIELD_TYPES).map(function (k) { return '<option value="' + k + '">' + FS_FIELD_TYPES[k] + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="fg" style="display:flex;align-items:center"><button type="button" class="bt bt-d" style="padding:6px 10px;font-size:11px" onclick="document.getElementById(\'' + fid + '\').remove()">🗑 حذف</button></div>';
    box.appendChild(row);
  };

  function fsLoadEmployees() {
    db.collection('users').where('role', 'in', ['employee', 'tech_admin']).get().then(function (snap) {
      fsEmployees = snap.docs.map(function (d) { return Object.assign({ uid: d.id }, d.data()); });
      var sel = document.getElementById('fsTargetEmp');
      if (!sel) return;
      sel.innerHTML = '<option value="">اختر موظفاً...</option>' +
        fsEmployees.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'ar'); })
          .map(function (e) { return '<option value="' + e.uid + '">' + escH(e.name || e.email) + '</option>'; }).join('');
    }).catch(function () {});
  }

  window.fsSendForm = function () {
    var tplKey = (document.getElementById('fsTemplateKey').value || 'custom');
    var isTpl = tplKey !== 'custom' && FS_TEMPLATES[tplKey];
    var targetUid = document.getElementById('fsTargetEmp').value;
    var note = (document.getElementById('fsNote').value || '').trim();
    var msg = document.getElementById('fsMsg');
    var title, fields;

    if (isTpl) {
      title = FS_TEMPLATES[tplKey].title;
      fields = FS_TEMPLATES[tplKey].fields || [];
    } else {
      title = (document.getElementById('fsTitle').value || '').trim();
      var fieldsBox = document.getElementById('fsFieldsBox');
      fields = [];
      fieldsBox.querySelectorAll('.fr').forEach(function (row, i) {
        var lbl = (row.querySelector('[data-role="label"]').value || '').trim();
        var typ = row.querySelector('[data-role="type"]').value;
        if (lbl) fields.push({ id: 'f' + i, label: lbl, type: typ });
      });
      if (!title) { msg.style.color = 'var(--no)'; msg.textContent = 'اكتب اسم النموذج أولاً.'; return; }
      if (!fields.length) { msg.style.color = 'var(--no)'; msg.textContent = 'أضف حقلاً واحداً على الأقل.'; return; }
    }

    if (!targetUid) { msg.style.color = 'var(--no)'; msg.textContent = 'اختر الموظف المستهدف.'; return; }

    var emp = fsEmployees.filter(function (e) { return e.uid === targetUid; })[0];
    msg.style.color = 'var(--tx3)'; msg.textContent = '⏳ جارٍ الإرسال...';

    db.collection('formRequests').add({
      templateLabel: title,
      templateKey: isTpl ? tplKey : 'custom',
      fields: fields,
      note: note,
      targetUid: targetUid,
      targetName: emp ? (emp.name || emp.email) : '',
      sentByUid: TG_USER.uid,
      sentByName: TG_USER.name,
      status: 'pending',
      values: {},
      createdAt: new Date()
    }).then(function () {
      msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم إرسال النموذج للموظف';
      document.getElementById('fsTargetEmp').value = '';
      document.getElementById('fsNote').value = '';
      if (!isTpl) {
        document.getElementById('fsTitle').value = '';
        document.getElementById('fsFieldsBox').innerHTML = '';
        fsAddField();
      }
      if (typeof tgSendPushToUser === 'function') {
        tgSendPushToUser(targetUid, '📝 نموذج جديد للتعبئة', title, 'form-new');
      }
    }).catch(function (err) {
      msg.style.color = 'var(--no)'; msg.textContent = '❌ ' + err.message;
    });
  };

  var _fsWatchSentUnsub = null;
  function fsWatchIncomingRequests() {
    if (_fsWatchSentUnsub) { _fsWatchSentUnsub(); _fsWatchSentUnsub = null; }
    
    // Watch all requests submitted by employees to Admin
    _fsWatchSentUnsub = db.collection('requests').onSnapshot(function (snap) {
      var items = [];
      snap.forEach(function (doc) {
        var data = doc.data();
        data.id = doc.id;
        data._source = 'requests';
        items.push(data);
      });

      // Also pull formRequests responses
      db.collection('formRequests').get().then(function (fSnap) {
        fSnap.forEach(function (fDoc) {
          var fData = fDoc.data();
          if (fData.status === 'submitted' || fData.status === 'answered' || fData.status === 'completed' || (fData.values && Object.keys(fData.values).length > 0)) {
            items.push({
              id: fDoc.id,
              _source: 'formRequests',
              type: fData.templateLabel || 'نموذج مخصص',
              userName: fData.targetName || 'موظف',
              details: fData.note || '',
              status: fData.status === 'pending' ? 'pending' : (fData.status === 'rejected' ? 'rejected' : 'approved'),
              values: fData.values || {},
              fields: fData.fields || [],
              createdAt: fData.createdAt
            });
          }
        });

        items.sort(function (a, b) {
          var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt && a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0);
          var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt && b.createdAt.seconds ? b.createdAt.seconds * 1000 : 0);
          return tb - ta;
        });

        fsIncomingCache = items;
        fsRenderIncomingInbox();
      }).catch(function () {
        fsIncomingCache = items;
        fsRenderIncomingInbox();
      });
    }, function (err) {
      var box = document.getElementById('fsSentList');
      if (box) box.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر التحميل: ' + escH(err.message) + '</div>';
    });
  }

  function fsRenderIncomingInbox() {
    var box = document.getElementById('fsSentList');
    if (!box) return;

    var filtered = fsIncomingCache.filter(function (r) {
      if (window.fsFilterStatus === 'pending') return r.status === 'pending';
      if (window.fsFilterStatus === 'approved') return r.status === 'approved';
      if (window.fsFilterStatus === 'rejected') return r.status === 'rejected';
      return true;
    });

    if (!filtered.length) {
      box.innerHTML = '<div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:40px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:800;">📩 لا توجد طلبات أو نماذج واردة من الموظفين حالياً.</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (r) {
      var isPending = (r.status === 'pending');
      var isApproved = (r.status === 'approved');
      var isRejected = (r.status === 'rejected');

      var badgeBg = isPending ? '#f59e0b' : (isApproved ? '#10b981' : '#ef4444');
      var badgeText = isPending ? '⏳ قيد الانتظار' : (isApproved ? '✅ تم القبول' : '❌ مرفوض');

      var dateStr = '';
      if (r.createdAt && r.createdAt.toDate) {
        dateStr = r.createdAt.toDate().toLocaleDateString('ar-EG');
      } else if (r.date) {
        dateStr = r.date;
      }

      var detailsHTML = '';
      if (r.details) {
        detailsHTML += '<div style="margin-top:6px; color:var(--tx); font-weight:700; font-size:13.5px; white-space:pre-line; line-height:1.6; background:var(--bg); padding:10px 14px; border-radius:10px; border:1px solid var(--bd);">' + escH(r.details) + '</div>';
      }
      if (r.reason) {
        detailsHTML += '<div style="margin-top:6px; color:var(--tx); font-weight:700; font-size:13px;"><strong style="color:var(--tx2);">السبب:</strong> ' + escH(r.reason) + '</div>';
      }
      if (r.fromDate) {
        detailsHTML += '<div style="margin-top:4px; color:var(--tx2); font-weight:700; font-size:12.5px;">📅 المدة: من <b>' + r.fromDate + '</b> إلى <b>' + (r.toDate || '—') + '</b> (' + (r.days || 1) + ' أيام)</div>';
      }
      if (r.fileUrl) {
        detailsHTML += '<div style="margin-top:8px;"><a href="' + r.fileUrl + '" target="_blank" class="bt bt-o" style="padding:4px 12px; font-size:12px; font-weight:800; border-color:#3b82f6; color:#38bdf8;">📎 عرض المرفق (' + escH(r.fileName || 'ملف') + ')</a></div>';
      }

      if (r.values && r.fields) {
        detailsHTML += '<div style="margin-top:8px; display:flex; flex-direction:column; gap:4px;">';
        r.fields.forEach(function (f) {
          var val = r.values[f.id] || '—';
          detailsHTML += '<div style="font-size:12.5px; color:var(--tx); font-weight:700;"><strong style="color:var(--tx2);">' + escH(f.label) + ':</strong> ' + escH(val) + '</div>';
        });
        detailsHTML += '</div>';
      }

      html += '<div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:18px; margin-bottom:16px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--bd); padding-bottom:10px; margin-bottom:12px;">' +
          '<div>' +
            '<div style="font-size:17px; font-weight:900; color:var(--tx); margin-bottom:4px;">' + escH(r.type || 'طلب نموذج') + '</div>' +
            '<div style="font-size:13px; color:var(--tx2); font-weight:700;">' +
              '👤 <b>' + escH(r.userName || r.name || r.targetName || 'موظف') + '</b>' + (r.dept ? ' | ' + escH(r.dept) : '') + (dateStr ? ' | 📅 ' + dateStr : '') +
            '</div>' +
          '</div>' +
          '<span class="badge" style="background:' + badgeBg + '; color:#ffffff; font-size:12.5px; font-weight:900; padding:5px 14px; border-radius:30px;">' + badgeText + '</span>' +
        '</div>' +

        detailsHTML +

        '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:14px; border-top:1px solid var(--bd); padding-top:10px;">' +
          '<div style="display:flex; gap:8px;">' +
            (isPending ?
              '<button type="button" onclick="fsReviewRequest(\'' + r.id + '\', \'approved\', \'' + r._source + '\')" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:12.5px; padding:6px 16px; border-radius:20px; border:none; cursor:pointer;">✅ قبول الطلب</button>' +
              '<button type="button" onclick="fsReviewRequest(\'' + r.id + '\', \'rejected\', \'' + r._source + '\')" class="bt" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; font-weight:900; font-size:12.5px; padding:6px 16px; border-radius:20px; border:none; cursor:pointer;">❌ رفض</button>' : '') +
          '</div>' +
          '<div style="display:flex; gap:8px;">' +
            '<button type="button" onclick="fsPrintIncomingRequest(\'' + r.id + '\')" class="bt bt-o" style="font-size:12px; padding:6px 14px; font-weight:800; border-radius:20px;">🖨 طباعة</button>' +
            '<button type="button" onclick="fsDeleteIncomingRequest(\'' + r.id + '\', \'' + r._source + '\')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:12px; padding:6px 14px; font-weight:800; border-radius:20px;">🗑 حذف</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });

    box.innerHTML = html;
  }

  // موافقة أو رفض الطلب الوارد
  window.fsReviewRequest = function (reqId, newStatus, source) {
    var coll = (source === 'formRequests') ? 'formRequests' : 'requests';
    db.collection(coll).doc(reqId).get().then(function (snap) {
      var req = snap.exists ? snap.data() : {};
      return db.collection(coll).doc(reqId).update({
        status: newStatus,
        reviewedBy: (TG_USER ? TG_USER.name : ''),
        reviewedAt: new Date()
      }).then(function () {
        var targetUid = req.uid || req.targetUid;
        if (targetUid && typeof tgSendPushToUser === 'function') {
          var isOk = (newStatus === 'approved');
          var title = isOk ? '✅ تمت الموافقة على طلبك' : '❌ تم رفض طلبك';
          var body = (req.type || req.templateLabel || 'الطلب') + ' — ' + (isOk ? 'تم اعتماد الطلب بنجاح' : 'تم عدم القبول');
          tgSendPushToUser(targetUid, title, body, 'request-reviewed');
        }
        if (typeof tgToast === 'function') tgToast(newStatus === 'approved' ? '✅ تم قبول الطلب' : '❌ تم رفض الطلب', 'ok');
        fsWatchIncomingRequests();
      });
    }).catch(function (err) {
      alert('خطأ: ' + err.message);
    });
  };

  // حذف طلب وارد
  window.fsDeleteIncomingRequest = function (reqId, source) {
    if (typeof tgConfirmModal === 'function') {
      tgConfirmModal(
        '🗑 حذف الطلب',
        'هل أنت متأكد من حذف هذا الطلب الوارد نهائياً؟',
        [
          { label: 'إلغاء', cls: 'bt-o', onClick: function () { if (typeof tgCloseModal === 'function') tgCloseModal(); } },
          { label: '🗑 حذف', cls: 'bt-d', onClick: function () {
            if (typeof tgCloseModal === 'function') tgCloseModal();
            var coll = (source === 'formRequests') ? 'formRequests' : 'requests';
            db.collection(coll).doc(reqId).delete()
              .then(function () {
                if (typeof tgToast === 'function') tgToast('✅ تم حذف الطلب', 'ok');
                fsWatchIncomingRequests();
              })
              .catch(function (err) { alert('تعذر الحذف: ' + err.message); });
          }}
        ]
      );
    } else {
      if (!confirm('هل تريد حذف هذا الطلب الوارد نهائياً؟')) return;
      var coll = (source === 'formRequests') ? 'formRequests' : 'requests';
      db.collection(coll).doc(reqId).delete()
        .then(function () {
          if (typeof tgToast === 'function') tgToast('✅ تم حذف الطلب', 'ok');
          fsWatchIncomingRequests();
        })
        .catch(function (err) { alert('تعذر الحذف: ' + err.message); });
    }
  };

  // طباعة طلب وارد
  window.fsPrintIncomingRequest = function (reqId) {
    var item = fsIncomingCache.filter(function (x) { return x.id === reqId; })[0];
    if (!item) return;

    var printTitle = item.type || 'طلب / نموذج موظف';
    var printContent =
      '<div style="font-family:sans-serif; direction:rtl; text-align:right; padding:20px;">' +
        '<div style="border-bottom:2px solid #10b981; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<h2 style="margin:0; color:#0f172a;">Tech Go — ' + escH(printTitle) + '</h2>' +
            '<p style="margin:4px 0 0; color:#64748b; font-size:13px;">مُقدم من الموظف إلى الإدارة</p>' +
          '</div>' +
          '<div style="background:#10b981; color:#fff; padding:6px 16px; border-radius:20px; font-weight:bold; font-size:13px;">' +
            'الحالة: ' + (item.status === 'approved' ? 'مقبول / معتمد' : (item.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار')) +
          '</div>' +
        '</div>' +

        '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:16px; margin-bottom:20px; font-size:14px; line-height:1.8;">' +
          '<div style="margin-bottom:8px;"><strong>👤 اسم الموظف:</strong> ' + escH(item.userName || item.name || item.targetName || '—') + '</div>' +
          (item.dept ? '<div style="margin-bottom:8px;"><strong>🏢 القسم / الإدارة:</strong> ' + escH(item.dept) + '</div>' : '') +
          (item.fromDate ? '<div style="margin-bottom:8px;"><strong>📅 الفترة:</strong> من ' + item.fromDate + ' إلى ' + (item.toDate || '—') + ' (' + (item.days || 1) + ' أيام)</div>' : '') +
          (item.details ? '<div style="margin-bottom:8px; white-space:pre-line;"><strong>📌 تفاصيل الطلب:</strong><br>' + escH(item.details) + '</div>' : '') +
          (item.reason ? '<div style="margin-bottom:8px;"><strong>💬 السبب:</strong> ' + escH(item.reason) + '</div>' : '') +
        '</div>' +

        '<div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center; font-weight:bold; font-size:13px;">' +
          '<div>توقيع الموظف:<br><br>_________________</div>' +
          '<div>اعتماد الإدارة:<br><br>_________________</div>' +
        '</div>' +
      '</div>';

    if (typeof printDoc === 'function') {
      printDoc(printContent);
    } else {
      var win = window.open('', '_blank');
      win.document.write('<html><head><title>' + printTitle + '</title></head><body>' + printContent + '<script>window.print();</script></body></html>');
      win.document.close();
    }
  };

  // ══════════════════════════ جهة الموظف (employee.html) ══════════════════════════
  var fsMyCache = [];

  var _fsMyReqUnsub = null;
  window.loadMyFormRequests = function (uid) {
    if (_fsMyReqUnsub) { _fsMyReqUnsub(); _fsMyReqUnsub = null; }
    _fsMyReqUnsub = db.collection('formRequests').where('targetUid', '==', uid)
      .onSnapshot(function (snap) {
        fsMyCache = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        fsRenderMyForms();
      }, function (err) {
        var box = document.getElementById('myFormsList');
        if (box) box.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر التحميل: ' + escH(err.message) + '</div>';
      });
  };

  function fsRenderMyForms() {
    var box = document.getElementById('myFormsList');
    if (!box) return;
    
    var filteredMyCache = fsMyCache.filter(function (r) {
      var k = r.templateKey;
      var lbl = r.templateLabel || '';
      if (k === 'perm' || k === 'leave' || k === 'delay' || k === 'emp' || k === 'res') return false;
      if (lbl.indexOf('إذن حضور') > -1 || lbl.indexOf('طلب إجازة') > -1 || lbl.indexOf('تعديل موعد الحضور') > -1 || lbl.indexOf('بيانات الموظف') > -1 || lbl.indexOf('استقالة') > -1) return false;
      return true;
    });

    var pendingCount = filteredMyCache.filter(function (r) { return r.status === 'pending'; }).length;
    var badge = document.getElementById('forms-badge');
    if (badge) { badge.style.display = pendingCount ? 'inline-block' : 'none'; badge.textContent = pendingCount; }
    if (typeof updateSmartTabTitle === 'function') updateSmartTabTitle();

    if (!filteredMyCache.length) { box.innerHTML = '<div class="empty-hint">لا توجد نماذج مخصصة مُرسلة لك حالياً.</div>'; return; }
    var sorted = filteredMyCache.slice().sort(function (a, b) { return a.status === 'pending' ? -1 : 1; });
    var h = '';
    sorted.forEach(function (r) {
      var pending = r.status === 'pending';
      h += '<div class="ac-row">' +
        '<div class="ac-t">' + escH(r.templateLabel || 'نموذج') +
          ' <span class="badge ' + (pending ? 'badge-pending' : 'badge-approved') + '">' + (pending ? 'بانتظار تعبئتك' : 'تم الإرسال') + '</span>' +
        '</div>' +
        (r.note ? '<div class="ac-meta">📌 ' + escH(r.note) + '</div>' : '') +
        '<div class="ac-meta">من: ' + escH(r.sentByName || 'الأدمن') + '</div>' +
        (pending ?
          '<div id="fsForm_' + r.id + '" style="margin-top:10px">' +
            ((FS_TEMPLATES[r.templateKey] && FS_TEMPLATES[r.templateKey].fill) ? FS_TEMPLATES[r.templateKey].fill() :
            (r.fields || []).map(function (f) {
              var inputHtml;
              if (f.type === 'textarea') {
                inputHtml = '<textarea rows="2" data-fid="' + f.id + '"></textarea>';
              } else if (f.type === 'select') {
                inputHtml = '<select data-fid="' + f.id + '"><option value="">اختر...</option>' +
                  (f.options || []).map(function (o) { return '<option value="' + escH(o) + '">' + escH(o) + '</option>'; }).join('') +
                  '</select>';
              } else {
                var inType = ['date', 'number', 'tel', 'time', 'email'].indexOf(f.type) > -1 ? f.type : 'text';
                inputHtml = '<input type="' + inType + '" data-fid="' + f.id + '">';
              }
              return '<div class="fg" style="margin-bottom:8px"><label>' + escH(f.label) + '</label>' + inputHtml + '</div>';
            }).join('')) +
            '<button class="bt bt-p" style="padding:6px 14px;font-size:11.5px" onclick="fsSubmitMyForm(\'' + r.id + '\')">📨 إرسال للأدمن</button>' +
            '<div id="fsMyMsg_' + r.id + '" style="font-size:11px;margin-top:6px"></div>' +
          '</div>'
          :
          '<div style="margin-top:8px">' +
            (r.fields || []).map(function (f) {
              return '<div class="ac-meta"><b>' + escH(f.label) + ':</b> ' + escH((r.values && r.values[f.id]) || '—') + '</div>';
            }).join('') +
          '</div>') +
      '</div>';
    });
    box.innerHTML = h;
  }

  window.fsSubmitMyForm = function (reqId) {
    var wrap = document.getElementById('fsForm_' + reqId);
    var msg = document.getElementById('fsMyMsg_' + reqId);
    if (!wrap) return;
    var values = {};
    var missing = false;
    var radioFids = {};
    wrap.querySelectorAll('[data-fid]').forEach(function (el) {
      var fid = el.getAttribute('data-fid');
      if (el.type === 'radio') {
        radioFids[fid] = true;
        if (el.checked) values[fid] = el.value;
        return;
      }
      var v = (el.value || '').trim();
      if (!v) missing = true;
      values[fid] = v;
    });
    Object.keys(radioFids).forEach(function (fid) { if (!values[fid]) missing = true; });
    if (missing) { msg.style.color = 'var(--no)'; msg.textContent = 'من فضلك املأ كل الحقول قبل الإرسال.'; return; }

    msg.style.color = 'var(--tx3)'; msg.textContent = '⏳ جارٍ الإرسال...';
    db.collection('formRequests').doc(reqId).update({
      status: 'submitted',
      values: values,
      submittedAt: new Date()
    }).then(function () {
      msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم الإرسال للأدمن';
      var reqData = fsMyCache.filter(function (r) { return r.id === reqId; })[0];
      tgNotifyAdmins('📝 رد جديد على نموذج', (TG_USER.name || 'موظف') + ' ملأ نموذج «' + (reqData.templateLabel || '') + '»', 'form-submitted');
    }).catch(function (err) {
      msg.style.color = 'var(--no)'; msg.textContent = '❌ ' + err.message;
    });
  };
  
  window.FS_TEMPLATES = FS_TEMPLATES;
  window.FS_OFFICIAL = FS_OFFICIAL;
})();
