import { auth } from '../JS/modules/dbConfig.js';
import { createChat, sendMessage, getChatsForUser, listenForMessages } from '../JS/modules/FS_Requests.js';

// Holds the chat the user is currently talking in.
let currentChatId = null;
let stopListeningToMessages = null;

function startListeningToCurrentChat() {
  if (stopListeningToMessages) {
    stopListeningToMessages();
  }
  stopListeningToMessages = listenForMessages(currentChatId);
}

//Updates the title of the current chat for visual reasons
function updateChatTitle() {
  const chatTitle = document.getElementById('chatTitle');
  if (!chatTitle) return;
  chatTitle.textContent = 'Currently sending messages in chat: ' + (currentChatId || 'none selected');
}

// Renders one button per chat; clicking a button sets the active chat.
function renderChatList(chats) {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;

  chatList.innerHTML = '';

  chats.forEach(chat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = chat.id;
    btn.addEventListener('click', () => {
      currentChatId = chat.id;
      updateChatTitle();
      startListeningToCurrentChat();
    });
    chatList.appendChild(btn);
  });

  // Auto-select first chat if none is active yet.
  if (!currentChatId && chats.length > 0) {
    currentChatId = chats[0].id;
  }

  updateChatTitle();
  startListeningToCurrentChat();
}

// Loads chats where the logged-in user is in participants[].
async function loadMyChats() {
  if (!auth.currentUser) return;
  const chats = await getChatsForUser(auth.currentUser.uid);
  renderChatList(chats);
 
}

// Refresh chat list when auth state becomes available.
auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadMyChats();
});



//Create chat button
document.getElementById('createChatBtn').addEventListener('click', async () => {

  const input = document.getElementById('createChat');

  const otherUserId = input.value.trim();
  if (!otherUserId || !auth.currentUser) return;

  // Use a sorted pair so the same two users always produce the same chatId.
  const participants = [auth.currentUser.uid, otherUserId];
  const chatId = [...participants].sort().join('_');

  await createChat(chatId, participants);
  // New chat becomes current immediately.
  currentChatId = chatId;
  updateChatTitle();
  startListeningToCurrentChat();
  await loadMyChats();

  input.value = "";
});


//Send button
document.getElementById('sendBtn').addEventListener('click', async () => {

  const input = document.getElementById('messageInput');
  // Require active chat, logged-in user, and non-empty text.
  if (!currentChatId || !auth.currentUser || !input.value.trim()) return;

  await sendMessage(currentChatId, {
    text: input.value.trim(),
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
});

updateChatTitle();