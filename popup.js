document.getElementById("summarizeButton").addEventListener("click", () => {
  const output = document.getElementById("summaryOutput");

  if (!output) {
    console.error("Could not find summaryOutput element");
    return;
  }

  output.innerHTML = '<p class="italic">⏳ Summarizing...</p>';

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "extractArticleText" },
      (response) => {
        if (chrome.runtime.lastError) {
          output.innerHTML =
            '<p class="error">Error: Try refreshing the page.</p>';
          return;
        }

        if (response && response.text) {
          output.textContent = response.text.slice(0, 300) + "...";
        } else {
          output.innerHTML = '<p class="error">No article text found.</p>';
        }
      }
    );
  });
});
