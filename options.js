document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["openrouterAPIKey"], ({ openrouterAPIKey }) => {
    if (openrouterAPIKey)
      document.getElementById("apiKey").value = openrouterAPIKey;
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) return;

    chrome.storage.sync.set({ openrouterAPIKey: apiKey }, () => {
      const status = document.getElementById("statusMessage");
      status.style.display = "block";
      status.textContent = "✅ Settings saved!";
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  });
});
