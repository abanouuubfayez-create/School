
    (function () {
        if (window.__openFontsPatched) return; window.__openFontsPatched = true;
        var _open = window.open;
        window.open = function () {
            var w = _open.apply(window, arguments);
            try {
                if (w) {
                    var inject = function () {
                        try {
                            var s = document.getElementById('embedded-fonts');
                            if (s && w.document && !w.document.getElementById('embedded-fonts')) {
                                var c = w.document.createElement('style');
                                c.id = 'embedded-fonts';
                                c.textContent = s.textContent;
                                (w.document.head || w.document.documentElement || w.document.body).appendChild(c);
                            }
                        } catch (e) { }
                    };
                    setTimeout(inject, 0); setTimeout(inject, 250); setTimeout(inject, 700);
                }
            } catch (e) { }
            return w;
        };
    })();
    