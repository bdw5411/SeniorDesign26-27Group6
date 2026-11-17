
 // script.js
 // Frontend logic for Senior Design chatbot

 // =========================================
 // AGENT AND CHAT DATA
 // =========================================

 // Default system message for each conversation
 const systemMessage = {
   role: "system",
   content: "You are a helpful AI assistant."
 };

 // Store agents and their conversations
 const agents = [
   {
     id: 1,
     name: "Agent 1",
     chats: [
       {
         id: 1,
         name: "Chat 1",
         messages: [{ ...systemMessage }],
         isLoading: false
       }
     ]
   }
 ];

 // Track the currently selected agent and chat
 let activeAgentId = 1;
 let activeChatId = 1;

 // Unique ID for each new chat
 let nextChatId = 2;


 // =========================================
 // HTML ELEMENTS
 // =========================================

 const chatLog = document.getElementById("chatLog");
 const chatForm = document.getElementById("chatForm");
 const userInput = document.getElementById("userInput");
 const sendButton = document.getElementById("sendButton");

 const agentChats = document.getElementById("agentChats");
 const addChatButton = document.getElementById("addChatButton");


 // =========================================
 // FIND ACTIVE AGENT AND CHAT
 // =========================================

 function getActiveAgent() {
   return agents.find(
     agent => agent.id === activeAgentId
   );
 }

 function getActiveChat() {
   const agent = getActiveAgent();

   return agent?.chats.find(
     chat => chat.id === activeChatId
   );
 }


 // =========================================
 // CREATE MESSAGE ELEMENT
 // =========================================

 function createMessageElement(text, role) {
   const div = document.createElement("div");

   div.className = `message ${role}`;

   // Display text safely without interpreting HTML
   div.textContent = text;
   div.style.whiteSpace = "pre-wrap";

   return div;
 }


 // =========================================
 // DISPLAY CURRENT CHAT
 // =========================================

 function renderChat() {

   // Clear currently displayed messages
   chatLog.innerHTML = "";

   const chat = getActiveChat();

   if (!chat) return;

   // Display conversation messages
   chat.messages.forEach(message => {

     // System instructions are not displayed
     if (message.role === "system") return;

     const displayRole =
       message.role === "assistant" ? "bot" : "user";

     const element = createMessageElement(
       message.content,
       displayRole
     );

     chatLog.appendChild(element);
   });

   // Display loading indicator
   if (chat.isLoading) {
     const loadingMessage = createMessageElement(
       "Thinking...",
       "bot"
     );

     chatLog.appendChild(loadingMessage);
   }

   // Scroll to the newest message
   chatLog.scrollTop = chatLog.scrollHeight;

   // Disable input while this chat is loading
   userInput.disabled = chat.isLoading;
   sendButton.disabled = chat.isLoading;
 }


 // =========================================
 // DISPLAY CHAT LIST
 // =========================================

 function renderChatList() {

   // Clear the current chat buttons
   agentChats.innerHTML = "";

   const agent = getActiveAgent();

   if (!agent) return;

   // Create a button for each chat
   agent.chats.forEach(chat => {

     const button = document.createElement("button");

     button.type = "button";
     button.className = "chat-item";
     button.textContent = chat.name;

     // Store chat ID in the button
     button.dataset.chatId = chat.id;

     // Highlight selected chat
     if (chat.id === activeChatId) {
       button.classList.add("active");
     }

     // Switch conversations when clicked
     button.addEventListener("click", () => {
       selectChat(chat.id);
     });

     agentChats.appendChild(button);
   });
 }


 // =========================================
 // SELECT AN EXISTING CHAT
 // =========================================

 function selectChat(chatId) {

   const agent = getActiveAgent();

   const selectedChat = agent?.chats.find(
     chat => chat.id === chatId
   );

   if (!selectedChat) return;

   // Change active conversation
   activeChatId = chatId;

   // Update sidebar and displayed messages
   renderChatList();
   renderChat();
 }


 // =========================================
 // CREATE A NEW CHAT
 // =========================================

 function createNewChat() {

   const agent = getActiveAgent();

   if (!agent) return;

   // Create a new conversation
   const newChat = {
     id: nextChatId++,
     name: `Chat ${agent.chats.length + 1}`,
     messages: [{ ...systemMessage }],
     isLoading: false
   };

   // Add conversation to the agent
   agent.chats.push(newChat);

   // Automatically switch to the new chat
   activeChatId = newChat.id;

   // Update the interface
   renderChatList();
   renderChat();

   userInput.focus();
 }


 // =========================================
 // SEND MESSAGES TO PYTHON BACKEND
 // =========================================

 async function fetchBotReply(messages) {

   const response = await fetch("/chat", {
     method: "POST",
     headers: {
       "Content-Type": "application/json"
     },
     body: JSON.stringify({ messages })
   });

   // Check for server errors
   if (!response.ok) {
     throw new Error(
       `Server error: ${response.status}`
     );
   }

   const data = await response.json();

   return data.reply;
 }


 // =========================================
 // HANDLE USER MESSAGES
 // =========================================

 chatForm.addEventListener("submit", async (event) => {

   event.preventDefault();

   // Get the currently selected chat
   const chat = getActiveChat();

   // Get the user's message
   const userMessage = userInput.value.trim();

   if (!chat || !userMessage || chat.isLoading) {
     return;
   }

   // Add user message to this chat's history
   chat.messages.push({
     role: "user",
     content: userMessage
   });

   // Mark chat as waiting for a response
   chat.isLoading = true;

   // Clear input
   userInput.value = "";

   // Display updated conversation
   renderChat();

   try {

     // Send this chat's messages to Groq
     const reply = await fetchBotReply(chat.messages);

     // Save AI response to this conversation
     chat.messages.push({
       role: "assistant",
       content: reply
     });

   } catch (error) {

     console.error(error);

     // Remove the failed user message from API history
     chat.messages.pop();

     // Display an error message
     chat.messages.push({
       role: "assistant",
       content: "Error: Unable to contact the chatbot."
     });

   } finally {

     // Mark this chat as finished loading
     chat.isLoading = false;

     // Only update the visible chat if the user
     // is still viewing the same conversation
     if (getActiveChat() === chat) {
       renderChat();
       userInput.focus();
     }
   }
 });


 // =========================================
 // BUTTON EVENT LISTENERS
 // =========================================

 // Create new chat when + button is clicked
 addChatButton.addEventListener(
   "click",
   createNewChat
 );


 // =========================================
 // INITIAL PAGE RENDER
 // =========================================

 renderChatList();
 renderChat();
