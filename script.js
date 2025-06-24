// script.js
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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error || "Unknown error.";
      replaceElementText(loadingMsg, `⚠️ Error: ${errorMsg}`);
    } else {
      const reply = data.reply || "⚠️ Empty response.";
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