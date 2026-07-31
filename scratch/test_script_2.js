
(function(){
    function checkConn(){
        var b=document.getElementById('offlineBanner');
        if(!b) return;
        if(!navigator.onLine){
            b.style.display='block';
            document.body.style.paddingTop='44px';
        } else {
            b.style.display='none';
            document.body.style.paddingTop='';
        }
    }
    window.addEventListener('offline', checkConn);
    window.addEventListener('online', function(){
        var b=document.getElementById('offlineBanner');
        if(b){ b.style.background='#10b981'; b.textContent='✅ عاد الاتصال بالإنترنت'; b.style.display='block'; document.body.style.paddingTop='44px'; }
        setTimeout(function(){ checkConn(); if(document.body.style.paddingTop) document.body.style.paddingTop=''; },2500);
    });
    checkConn();
})();
