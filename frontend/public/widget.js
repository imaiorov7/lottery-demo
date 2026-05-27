// Lottery Widget Popup Script
// Include this script on your casino site to enable the lottery widget popup

(function() {
  function openLotteryWidget(lotteryId) {
    var existing = document.getElementById('lottery-widget-overlay');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'lottery-widget-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px';

    var container = document.createElement('div');
    container.style.cssText = 'position:relative;width:420px;max-width:100%;height:700px;max-height:90vh';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00d7';
    closeBtn.style.cssText = 'position:absolute;top:-12px;right:-12px;z-index:10;background:#4b5563;color:white;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center';
    closeBtn.onclick = function() {
      overlay.style.display = 'none';
    };

    var iframe = document.createElement('iframe');
    var baseUrl = (document.currentScript && document.currentScript.src)
      ? document.currentScript.src.replace(/\/widget\.js.*$/, '')
      : 'http://localhost:5173';
    var src = baseUrl + '/widget?theme=dark';
    if (lotteryId) src += '&lottery=' + lotteryId;
    iframe.src = src;
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5)';
    iframe.allow = 'clipboard-write';

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    overlay.onclick = function(e) {
      if (e.target === overlay) overlay.style.display = 'none';
    };
  }

  window.openLotteryWidget = openLotteryWidget;
})();
