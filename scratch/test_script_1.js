
    (function() {
        const theme = localStorage.getItem('tg-theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    })();
