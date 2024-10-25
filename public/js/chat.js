lucide.createIcons();

const chatIcon = document.getElementById("chat-icon");
const chatWindow = document.getElementById("chat-window");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

chatIcon.addEventListener("click", () => {
  chatWindow.classList.toggle("hidden");
});

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (message) {
    appendMessage("user", message);
    fetchResponse(message);
    userInput.value = "";
  }
}

function appendMessage(sender, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `mb-2 ${
    sender === "user" ? "text-right" : "text-left"
  }`;
  messageDiv.innerHTML = `
        <div class="inline-block p-2 rounded-lg ${
          sender === "user" ? "bg-blue-100" : "bg-gray-200"
        }">
            ${content}
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function fetchResponse(message) {
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: message }),
    });
    const data = await response.json();
    appendMessage("bot", data.response);
  } catch (error) {
    console.error("Error:", error);
    appendMessage(
      "bot",
      "Sorry, there was an error processing your request."
    );
  }
}