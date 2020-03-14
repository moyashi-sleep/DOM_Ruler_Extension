// TODO: on/offは別の方法で保持する
// ポップアップを開くたびに読み込み直されてfalseに初期化されてしまうため
let isEnabled = false;

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("ActiveToggle").addEventListener("click", function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      isEnabled = isEnabled ? false : true;
      // TODO: FLUX Standard Actionみたいな形式にする
      const message = {
        isEnabled: isEnabled,
      };
      chrome.tabs.sendMessage(tabs[0].id, message, function() {
      });
    });
  });
});