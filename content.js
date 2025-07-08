function extractArticleText() {
  const articleElement = document.querySelector("article");
  if (articleElement) {
    console.log("Article element found:", articleElement);
    return articleElement.innerText;
  }

  const paragraphs = Array.from(document.querySelectorAll("p"));
  if (paragraphs.length > 0) {
    return paragraphs.map((p) => p.innerText).join("\n");
  }

  const fallback = document.body?.innerText;
  if (fallback && fallback.length > 50) {
    console.log("⚠️ Using fallback: document.body.innerText");
    return fallback;
  }

  console.log("❌ No readable article text found.");
  return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticleText") {
    const articleText = extractArticleText();
    if (articleText) {
      sendResponse({ articleText });
    } else {
      sendResponse({ error: "No article text found." });
    }
  }
  return true;
});
