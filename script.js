const API_KEY = "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";
const chatForm = document.getElementById("chat-form");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";
  userInput.focus();

  appendMessage("bot", "Typing...");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://yourdomain.com",
        "X-Title": "ChatGPT Clone",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";
    
    replaceLastBotMessage(reply);
  } catch (err) {
    console.error(err);
    replaceLastBotMessage("Error fetching response.");
  }
});

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerText = text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function replaceLastBotMessage(newText) {
  const messages = document.querySelectorAll(".message.bot");
  const lastBotMsg = messages[messages.length - 1];
  if (lastBotMsg) lastBotMsg.innerText = newText;
  chatContainer.scrollTop = chatContainer.scrollHeight;
          }
