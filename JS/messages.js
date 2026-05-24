//Author: Viktor Eliassen
import { auth } from '../JS/modules/dbConfig.js';
import { createChat, sendMessage, getChatsForUser, listenForMessages, getUser } from '../JS/modules/FS_Requests.js';

// Runtime state: active chat, active Firestore unsubscribe function, and cached users.
let currentChatId = null;
let stopListeningToMessages = null;
let usersById = {};

// Cache DOM elements once so we do not query repeatedly.
const createChatSelect = document.getElementById('createChat');
const createChatBtn = document.getElementById('createChatBtn');
const chatList = document.getElementById('chatList');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');

// Converts a uid to a readable name for UI labels.
function getUserDisplayName(uid) {
  if (uid === auth.currentUser?.uid) return 'You';
  return usersById[uid]?.name?.display || uid;
}

// Builds the chat button/title label from the other participant in the chat.
function getChatLabel(chat) {
  const otherUid = (chat.participants || []).find(uid => uid !== auth.currentUser?.uid);
  return otherUid ? getUserDisplayName(otherUid) : chat.id;
}

// Ensures we only keep one live listener: stop old listener, start new on selected chat.
function startListeningToCurrentChat() {
  if (stopListeningToMessages) stopListeningToMessages();
  stopListeningToMessages = listenForMessages(currentChatId);
}

// Loads users once, caches them by uid, and fills the Create Chat dropdown.
async function loadUsers() {
  if (!auth.currentUser || !createChatSelect) return;

  const users = await getUser();
  usersById = Object.fromEntries(users.map(user => [user.id, user]));

  createChatSelect.innerHTML = '';

  users
    .filter(user => user.id !== auth.currentUser.uid)
    .forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name?.display || user.id;
      createChatSelect.appendChild(option);
    });
}

// Draws active chat buttons for changing between active chats. Clicking a button selects the chat and starts message listening.
function renderChatList(chats) {
  if (!chatList) return;

  chatList.innerHTML = '';

  chats.forEach(chat => {
    const btn = document.createElement('button');
    btn.type = 'button';

    if (chat.id === currentChatId) btn.classList.add('active-chat-btn');
    btn.textContent = getChatLabel(chat);
    btn.addEventListener('click', () => {
      currentChatId = chat.id;
      renderChatList(chats); //to update the active-chat-btn
      startListeningToCurrentChat();
    });
    chatList.appendChild(btn);
  });
}

// Main page refresh: load users, load chats, select default chat, render UI, start listener.
async function refreshMessagesPage() {
  if (!auth.currentUser) return;

  await loadUsers();

  const chats = await getChatsForUser(auth.currentUser.uid);

  if (!currentChatId && chats.length > 0) {
    currentChatId = chats[0].id;
  }

  renderChatList(chats);
  startListeningToCurrentChat();
}

// Initialize the page only when auth state is ready.
auth.onAuthStateChanged((user) => {
  if (!user) return;
  refreshMessagesPage();
});

// Creates a chat with selected user, then refreshes list/title/listener state.
createChatBtn?.addEventListener('click', async () => {
  const otherUserId = createChatSelect?.value;
  if (!otherUserId || !auth.currentUser) return;

  const participants = [auth.currentUser.uid, otherUserId];
  const chatId = [...participants].sort().join('_');

  await createChat(chatId, participants);
  currentChatId = chatId;
  await refreshMessagesPage();

  if (createChatSelect) createChatSelect.selectedIndex = 0;
});

// Sends one message to the currently selected chat.
sendBtn?.addEventListener('click', async () => {
  if (!currentChatId || !auth.currentUser || !messageInput?.value.trim()) return;

  await sendMessage(currentChatId, {
    text: messageInput.value.trim(),
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  messageInput.value = '';
});
