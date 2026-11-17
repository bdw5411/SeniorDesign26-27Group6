
// script.js
// Frontend logic for Senior Design chatbot

// Store conversation history for this page session
const chatHistory = [
  {
    role: "system",
    content: "You are a helpful AI assistant."
  }
];

// Create message element
function createMessageElement(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  // Safely display text without interpreting HTML
  div.textContent = text;
  div.style.whiteSpace = "pre-wrap";

  return div;
}

// Display message
function addMessage(text, role) {
  const chatLog = document.getElementById("chatLog");

  const element = createMessageElement(text, role);
  chatLog.appendChild(element);

  chatLog.scrollTop = chatLog.scrollHeight;
}

// Send messages to Python backend
async function fetchBotReply(messages) {
  const response = await fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(
      `Server error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.reply;
}

// Handle user messages
document.getElementById("chatForm")
  .addEventListener("submit", async (event) => {

    event.preventDefault();

    const input = document.getElementById("userInput");
    const button = document.querySelector(
      "#chatForm button"
    );

    const userMessage = input.value.trim();

    if (!userMessage) return;

    // Display user message
    addMessage(userMessage, "user");

    // Add message to conversation history
    chatHistory.push({
      role: "user",
      content: userMessage
    });

    input.value = "";
    input.disabled = true;
    button.disabled = true;

    try {
      // Request AI response
      const reply = await fetchBotReply(chatHistory);

      // Display AI response
      addMessage(reply, "bot");

      // Save response to conversation history
      chatHistory.push({
        role: "assistant",
        content: reply
      });

    } catch (error) {
      console.error(error);

      addMessage(
        "Error: Unable to contact the chatbot.",
        "bot"
      );

      // Remove failed user message from API history
      chatHistory.pop();

    } finally {
      input.disabled = false;
      button.disabled = false;
      input.focus();
    }
  });
