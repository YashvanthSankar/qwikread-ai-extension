chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["openrouterAPIKey"], ({ openrouterAPIKey }) => {
    if (!openrouterAPIKey) {
      chrome.tabs.create({
        url: "options.html",
      });
    }
  });
});
