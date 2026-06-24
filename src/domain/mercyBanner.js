
                        // إظهار بانر الرأفة فقط عند تفعيلها
                        (function _checkMercyBanner() {
                            try {
                                const el = document.getElementById('mercy-annual-notice');
                                if (el && typeof DB !== 'undefined' && DB && DB.settings && DB.settings.mercyEnabled) el.style.display = 'block';
                                else if (el) el.style.display = 'none';
                            } catch(e){}
                            setTimeout(_checkMercyBanner, 2000);
                        })();
                    