document.getElementById("summarizeButton").addEventListener("click", () => {
  const output = document.getElementById("summaryOutput");
  if (!output) {
    console.error("Could not find summaryOutput element");
    return;
  }
  output.innerHTML = '<p class="italic">\u23F3 Summarizing...</p>';

  const summaryType = document.getElementById("summaryType")?.value;

  // Get the Gemini API key from storage
  chrome.storage.sync.get(["openrouterAPIKey"], ({ openrouterAPIKey }) => {
    if (!openrouterAPIKey) {
      output.innerHTML =
        '<p class="error">\u26A0\uFE0F Please set your Gemini API key in options.</p>';
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
              '<p class="error">\u274C Failed to extract article text.</p>';
            return;
          }

          // Send the article text to the background script for summarization

          try {
            const summary = await getSummary(
              response.text,
              summaryType,
              openrouterAPIKey
            );

            output.innerHTML = `<p class="summary">${summary}</p>`;
          } catch (error) {
            console.error("Error getting summary:", error);
            output.innerHTML = `<p class="error">\u274C ${
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
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://your-extension-id.chromiumapp.org", // Replace if needed
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [
            {
              role: "system",
              content: "You are a helpful summarization assistant.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 512,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      const errorMessage =
        data?.error?.message ||
        `API request failed with status ${response.status}`;

      if (response.status === 503 && retries > 0) {
        document.getElementById("summaryOutput").innerHTML = `
          <p class="italic text-yellow-500">\uD83D\uDD01 Model busy, retrying in ${
            delay / 1000
          }s...</p>
        `;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return await getSummary(rawText, type, apiKey, retries - 1, delay * 2);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content.trim() ||
      "\u26A0\uFE0F No summary returned."
    );
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
    const prevText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = prevText;
    }, 2000);
  });
});
