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
              response.text,
              summaryType,
              geminiAPIKey
            );

            output.innerHTML = `<p class="summary">${summary}</p>`;
          } catch (error) {
            console.error("Error getting summary:", error);
            output.innerHTML = `<p class="error">❌ ${
              error.message || "An error occurred while summarizing."
            }</p>`;
            return;
          }
        }
      );
    });
  });
});

async function getSummary(rawText, type, apiKey, retries = 3, delay = 2000) {
  const max = 25000;
  const text = rawText.length > max ? rawText.slice(0, max) : rawText;

  const promptMap = {
    brief: `Summarize the following text in 3 sentences.\n\n${text}`,
    detailed: `Summarize the following text in 5-7 sentences.\n\n${text}`,
    bulleted: `Summarize the following text in bullet points (start each line with hyphen).\n\n${text}`,
    headlines: `Extract key headlines from the following text (start with hyphen and all uppercase).\n\n${text}`,
  };

  const prompt = promptMap[type] || promptMap.brief;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      const errorMessage =
        data?.error?.message ||
        `API request failed with status ${response.status}`;

      // Retry logic on 503 (Service Unavailable)
      if (response.status === 503 && retries > 0) {
        document.getElementById("summaryOutput").innerHTML = `
          <p class="italic text-yellow-500">🔁 Model busy, retrying in ${
            delay / 1000
          }s...</p>
        `;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return await getSummary(rawText, type, apiKey, retries - 1, delay * 2); // exponential backoff
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    throw err;
  }
}

document.getElementById("copyButton").addEventListener("click", () => {
  const txt = document.getElementById("summaryOutput")?.innerText;
  if (!txt || txt.trim() === "") {
    return;
  }

  navigator.clipboard.writeText(txt).then(() => {
    const button = document.getElementById("copyButton");
    prevText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = prevText;
    }, 2000);
  });
});
