chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["geminiAPIKey"], (result) => {
    if (!result.geminiAPIKey) {
      chrome.tabs.create({
        url: "options.html",
      });
    }
  });
});
