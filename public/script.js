const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");
const actionArea = document.getElementById("action-area");

// Sidebar Elements
const statusDot = document.querySelector(".status-badge .dot");
const statusText = document.getElementById("status-text");
const currentTactic = document.getElementById("current-tactic");

// Generate a random session ID for demo
const sessionId = "demo_" + Math.floor(Math.random() * 10000);

userInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  // 1. Add user message to UI
  appendMessage(msg, "user");
  userInput.value = "";
  
  // Update Tactic based on user input (UI anticipation)
  updateSidebarAnticipation(msg);

  // 2. Show typing indicator
  typingIndicator.classList.remove("hidden");
  // Scroll to bottom
  chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;

  try {
    // 3. Send to backend
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: msg, sessionId })
    });

    const data = await response.json();

    // 4. Hide typing, add bot message
    typingIndicator.classList.add("hidden");
    
    // Parse markdown-like bold tags for UI formatting
    const formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    appendMessage(formattedReply, "bot");

    // 5. Update Sidebar based on Backend Lead Score
    updateLeadStatus(data.leadScore);

    // 6. Handle Special Actions (e.g., Show CTA)
    if (data.action === "SHOW_CTA") {
      actionArea.classList.remove("hidden");
      currentTactic.innerText = "Closing the Deal 💰";
      currentTactic.style.color = "#166534";
      currentTactic.style.background = "#dcfce7";
      currentTactic.style.borderColor = "#bbf7d0";
    }

  } catch (error) {
    typingIndicator.classList.add("hidden");
    appendMessage("Error connecting to Aura Engine. Is the server running?", "bot");
    console.error("Chat error:", error);
  }
}

function appendMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;
  
  const avatarIcon = sender === 'bot' ? '<i class="fa-solid fa-robot"></i>' : 'U';

  msgDiv.innerHTML = `
    <div class="msg-avatar">${avatarIcon}</div>
    <div class="msg-content">
      <p>${text}</p>
    </div>
  `;
  
  chatBox.appendChild(msgDiv);
  // Scroll main window to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateSidebarAnticipation(msg) {
  const text = msg.toLowerCase();
  if (text.includes("price") || text.includes("cost") || text.includes("kya hai")) {
    currentTactic.innerText = "Pitching Offer 🔥";
  } else if (text.includes("soch") || text.includes("think") || text.includes("later")) {
    currentTactic.innerText = "Applying Scarcity ⏳";
  } else if (text.includes("interested") || text.includes("buy")) {
    currentTactic.innerText = "Preparing CTA 🎯";
  } else {
    currentTactic.innerText = "Analyzing Intent 🧠";
  }
}

function updateLeadStatus(scoreType) {
  // Reset classes
  statusDot.className = "dot";
  
  if (scoreType === "HOT") {
    statusDot.classList.add("hot");
    statusText.innerText = "Hot Lead 🔥";
    statusText.style.color = "var(--hot)";
  } else if (scoreType === "WARM") {
    statusDot.classList.add("warm");
    statusText.innerText = "Warm Lead ⚡";
    statusText.style.color = "var(--warm)";
  } else {
    statusDot.classList.add("cold");
    statusText.innerText = "Cold Lead ❄️";
    statusText.style.color = "var(--cold)";
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // UI Anticipation
  appendMessage(`📎 Uploaded: ${file.name}`, "user");
  currentTactic.innerText = "Analyzing Document 📄";
  typingIndicator.classList.remove("hidden");
  chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("sessionId", sessionId);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    typingIndicator.classList.add("hidden");
    const formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    appendMessage(formattedReply, "bot");
    updateLeadStatus(data.leadScore);
    
    if (data.action === "SHOW_CTA") {
      actionArea.classList.remove("hidden");
      currentTactic.innerText = "Closing the Deal 💰";
    }

  } catch (error) {
    typingIndicator.classList.add("hidden");
    appendMessage("Error processing file.", "bot");
  }
}
