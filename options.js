document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["geminiAPIKey"], ({ geminiAPIKey }) => {
    if (geminiAPIKey) document.getElementById("apiKey").value = geminiAPIKey;
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) return;

    chrome.storage.sync.set({ geminiAPIKey: apiKey }, () => {
      const status = document.getElementById("statusMessage");
      status.style.display = "block";
      status.textContent = "✅ Settings saved!";
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  });
});
