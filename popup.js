let isEnabled = false;

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("ActiveToggle").addEventListener("click", function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      isEnabled = isEnabled ? false : true;
      const message = {
        isEnabled: isEnabled,
      };
      chrome.tabs.sendMessage(tabs[0].id, message, function() {
      });
    });
  });
});