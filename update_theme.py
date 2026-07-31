flatpickr_code = """

// Load Flatpickr dynamically to override date inputs
(function loadFlatpickr() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
    document.head.appendChild(link);
    
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
    script.onload = function() {
        initGlobalDatepickers();
    };
    document.head.appendChild(script);
})();

function initGlobalDatepickers() {
    if (typeof flatpickr === 'undefined') return;
    
    function applyFlatpickr(el) {
        if (!el._flatpickr) {
            flatpickr(el, {
                altInput: true,
                altFormat: 'd/m/Y', // DD/MM/YYYY
                dateFormat: 'Y-m-d',
                onReady: function(selectedDates, dateStr, instance) {
                    if (instance.altInput && el.getAttribute('style')) {
                        instance.altInput.setAttribute('style', el.getAttribute('style'));
                    }
                }
            });
        }
    }

    document.querySelectorAll('input[type="date"]').forEach(applyFlatpickr);

    // Watch for dynamically added date inputs (e.g. in modals)
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    if (node.matches('input[type="date"]')) applyFlatpickr(node);
                    node.querySelectorAll('input[type="date"]').forEach(applyFlatpickr);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
"""

with open('theme.js', 'a', encoding='utf-8') as f:
    f.write(flatpickr_code)
print("Flatpickr added to theme.js")
