// Switchにイベントハンドラを設定
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("ActiveToggle").addEventListener("click", function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // TODO: FLUX Standard Actionみたいな形式にする
      chrome.tabs.sendMessage(tabs[0].id, toggleEnable(), function(response) {
        const toggle = document.getElementById("ActiveToggle");
        toggle.classList.remove("status-" + (response ? "off" : "on"));
        toggle.classList.add("status-" + (response ? "on" : "off"));
      });
    });
  });
});

// Popup表示時にcontentScriptからisEnabledを取得し、Switchの状態を更新する
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(tabs[0].id, getEnable(), function (response) {
    const toggle = document.getElementById("ActiveToggle");
    toggle.classList.remove("status-" + (response ? "off" : "on"));
    toggle.classList.add("status-" + (response ? "on" : "off"));
  });
});

// ActionCreator
function toggleEnable() {
  return {
    type: "TOGGLE_ENABLE",
  };
}

function getEnable() {
  return {
    type: "GET_ENABLE",
  };
}