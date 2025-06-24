// script.js
const chatForm = document.getElementById("chat-form");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarOpen = document.getElementById("sidebar-open");
const themeToggle = document.getElementById("theme-toggle");
const historySearch = document.getElementById("history-search");
const chatHistory = document.getElementById("chat-history");

// Initialize current session and load chat history
let currentSession = [];
let chatHistoryData = JSON.parse(localStorage.getItem("chatHistory")) || [];

window.addEventListener("load", () => {
  appendMessage("bot", "👋 Hello! How can I help you today?");
  renderChatHistory();
});

// Save current session to chat history on page unload
window.addEventListener("beforeunload", () => {
  if (currentSession.length > 0) {
    const session = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      messages: currentSession,
    };
    chatHistoryData.push(session);
    localStorage.setItem("chatHistory", JSON.stringify(chatHistoryData));
  }
});

// Chat response logic (as provided)
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  addToCurrentSession("user", message);
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
      addToCurrentSession("bot", `⚠️ Error: ${errorMsg}`);
    } else {
      const reply = data.reply || "⚠️ Empty response.";
      replaceElementText(loadingMsg, reply);
      addToCurrentSession("bot", reply);
    }
  } catch (err) {
    replaceElementText(loadingMsg, `⚠️ Network Error: ${err.message}`);
    addToCurrentSession("bot", `⚠️ Network Error: ${err.message}`);
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

// Add message to current session
function addToCurrentSession(role, text) {
  currentSession.push({ role, text, timestamp: new Date().toISOString() });
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

// Chat history rendering
function renderChatHistory() {
  chatHistory.innerHTML = "";
  const searchQuery = historySearch.value.toLowerCase();
  const filteredSessions = chatHistoryData.filter((session) =>
    session.messages.some((msg) => msg.text.toLowerCase().includes(searchQuery))
  );

  filteredSessions.forEach((session) => {
    const firstMessage = session.messages[0]?.text || "Empty session";
    const li = document.createElement("li");
    li.innerText = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    li.title = firstMessage;
    li.addEventListener("click", () => {
      session.messages.forEach((msg) => {
        appendMessage(msg.role, msg.text);
      });
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