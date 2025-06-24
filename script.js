// script.js
const chatForm = document.getElementById("chatForm");
const chatContainer = document.getElementById("chat-area");
const userInput = document.getElementById("userInput");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOpen = document.getElementById("sidebarOpen");
const themeToggle = document.getElementById("themeToggle");
const historySearch = document.getElementById("historySearch");
const chatHistory = document.getElementById("chatHistory");

// Initialize chat history from localStorage
let history = JSON.parse(localStorage.getItem("chatHistory")) || [];

window.addEventListener("load", () => {
  appendMessage("bot", "👋 Hello! How can I help you today?");
  renderChatHistory();
});

// Chat response logic (as provided)
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  saveToHistory("user", message);
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
      saveToHistory("bot", reply);
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

// Sidebar toggle
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

sidebarOpen.addEventListener("click", () => {
  sidebar.classList.add("open");
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeToggle.innerHTML = document.body.classList.contains("light")
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
});

// Chat history management
function saveToHistory(role, text) {
  const timestamp = new Date().toISOString();
  history.push({ role, text, timestamp });
  localStorage.setItem("chatHistory", JSON.stringify(history));
  renderChatHistory();
}

function renderChatHistory() {
  chatHistory.innerHTML = "";
  const filteredHistory = history.filter((item) =>
    item.text.toLowerCase().includes(historySearch.value.toLowerCase())
  );
  filteredHistory.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerText = item.text.slice(0, 50) + (item.text.length > 50 ? "..." : "");
    li.title = item.text;
    li.addEventListener("click", () => {
      appendMessage(item.role, item.text);
    });
    chatHistory.appendChild(li);
  });
}

historySearch.addEventListener("input", renderChatHistory);

// Auto-resize textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = `${userInput.scrollHeight}px`;
});