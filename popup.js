document.getElementById("summarizeButton").addEventListener("click", () => {
  const output = document.getElementById("summaryOutput");
  if (!output) {
    console.error("Could not find summaryOutput element");
    return;
  }
  output.innerHTML = '<p class="italic">⏳ Summarizing...</p>';

  const summaryType = document.getElementById("summaryType")?.value;

  // Get the Gemini API key from storage
  chrome.storage.sync.get(["geminiAPIKey"], ({ geminiAPIKey }) => {
    if (!geminiAPIKey) {
      output.innerHTML =
        '<p class="error">⚠️ Please set your Gemini API key in options.</p>';
      return;
    }

    // Send message to content script to extract article text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "extractArticleText" },
        async (response) => {
          if (chrome.runtime.lastError || !response || !response.text) {
            output.innerHTML =
              '<p class="error">❌ Failed to extract article text.</p>';
            return;
          }

          // Send the article text to the background script for summarization

          try {
            const summary = await getSummary(
              response,
              summaryType,
              geminiAPIKey
            );

            output.innerHTML = `<p class="summary">${summary}</p>`;
          } catch (error) {
            console.error("Error getting summary:", error);
            output.innerHTML =
              '<p class="error">❌ An error occurred while summarizing.</p>';
            return;
          }
        }
      );
    });
  });
});

async function getSummary(rawText, type, apiKey) {
  const max = 25000;
  const text = rawText.length > max ? rawText.slice(0, max) : rawText;

  const promptMap = {
    brief: "Summarize the following text in 3 sentences.\n\n${text}",
    detailed: "Summarize the following text in 5-7 sentences.\n\n${text}",
    bulleted:
      "Summarize the following text in bullet points(start each line with hyphen).\n\n${text}",
    headlines:
      "Extract key headlines from the following text (start with hyphen and all uppercase).\n\n${text}",
  };

  const prompt = promptMap[type] || promptMap.brief;
}
