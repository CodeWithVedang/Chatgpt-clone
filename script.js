const API_KEY = "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";
const chatForm = document.getElementById("chat-form");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");

window.addEventListener("load", () => {
  appendMessage("bot", "👋 Hello! How can I help you today?");
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";
  userInput.focus();

  const loadingMsg = appendMessage("bot", "Typing...");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://yourdomain.com", // Optional
        "X-Title": "ChatGPT Clone",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          { role: "system", content: "You are a helpful assistant. Always respond in English." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || "Unknown error from OpenRouter.";
      replaceElementText(loadingMsg, `⚠️ Error: ${errorMsg}`);
    } else {
      const reply = data.choices?.[0]?.message?.content?.trim() || "⚠️ Empty response.";
      replaceElementText(loadingMsg, reply);
    }
  } catch (err) {
    replaceElementText(loadingMsg, `⚠️ Network Error: ${err.message}`);
  }
});

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerText = text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

function replaceElementText(element, newText) {
  if (element) {
    element.innerText = newText;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}