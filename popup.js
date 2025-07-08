document.getElementById("summarizeButton").addEventListener("click", () => {
  const output = document.querySelector("#summaryOutput");
  output.innerText = "⏳ Summarizing...";

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "extractArticleText" },
      (response) => {
        output.textContent = response
          ? response.slice(0, 1000)
          : "No article text found.";
      }
    );
  });
});
