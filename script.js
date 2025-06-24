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
const newChatButton = document.getElementById("new-chat");

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

// New Chat button handler
newChatButton.addEventListener("click", () => {
  if (currentSession.length > 0) {
    const session = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      messages: currentSession,
    };
    chatHistoryData.push(session);
    localStorage.setItem("chatHistory", JSON.stringify(chatHistoryData));
    renderChatHistory();
  }
  currentSession = [];
  chatContainer.innerHTML = "";
  appendMessage("bot", "👋 Hello! How can I help you today?");
  userInput.value = "";
  userInput.focus();
});

// Chat response logic with Markdown formatting and error handling
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

    const text = await response.text(); // Get raw text to handle malformed JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      replaceElementText(loadingMsg, `⚠️ Error: Invalid response format: ${text.substring(0, 50)}...`);
      addToCurrentSession("bot", `⚠️ Error: Invalid response format: ${text.substring(0, 50)}...`);
      return;
    }

    if (!response.ok || data.error) {
      const errorMsg = data.error || "Unknown error.";
      replaceElementText(loadingMsg, `⚠️ Error: ${markdownToHtml(errorMsg)}`);
      addToCurrentSession("bot", errorMsg);
    } else {
      const reply = data.reply || "Empty response.";
      const formattedReply = markdownToHtml(reply); // Convert Markdown to HTML
      replaceElementText(loadingMsg, formattedReply);
      addToCurrentSession("bot", reply); // Store raw text in session
    }
  } catch (err) {
    replaceElementText(loadingMsg, `⚠️ Network Error: ${markdownToHtml(err.message)}`);
    addToCurrentSession("bot", `⚠️ Network Error: ${err.message}`);
  }
});

// Append message with HTML support
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerHTML = markdownToHtml(text); // Use innerHTML for formatted content
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

function replaceElementText(element, newText) {
  if (element) {
    element.innerHTML = markdownToHtml(newText); // Use innerHTML for formatted content
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Add message to current session (store raw text)
function addToCurrentSession(role, text) {
  currentSession.push({ role, text, timestamp: new Date().toISOString() });
}

// Markdown to HTML conversion
function markdownToHtml(md) {
  // Escape HTML to prevent XSS
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```code```
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    return `<code>${code}</code>`;
  });

  // Headings
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Bold: **bold**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic: *italic* and _italic_
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");

  // Blockquotes: > quote
  html = html.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "<a href='$2' target='_blank'>$1</a>");

  // Bulleted lists
  html = html.replace(/((?:^[-*] .*(?:\n|$))+)/gm, (match) => {
    const items = match
      .trim()
      .split(/\n/)
      .map((item) => item.replace(/^[-*] (.*)/, "<li>$1</li>"))
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Numbered lists
  html = html.replace(/((?:^\d+\. .*(?:\n|$))+)/gm, (match) => {
    const items = match
      .trim()
      .split(/\n/)
      .map((item) => item.replace(/^\d+\. (.*)/, "<li>$1</li>"))
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs: convert two newlines into <p>
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Cleanup: don't wrap blocks inside <p>
  html = html
    .replace(/<p>(<(ul|ol|pre|blockquote|h\d)[\s\S]*?<\/\2>)<\/p>/g, "$1")
    .replace(/<\/(ul|ol|pre|blockquote)><p>/g, "</$1>")
    .replace(/<\/p><(ul|ol|pre|blockquote|h\d)>/g, "<$1>");

  return html;
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