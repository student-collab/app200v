import { auth } from '../JS/modules/dbConfig.js';
import { createChat, sendMessage, getChatsForUser } from '../JS/modules/FS_Requests.js';

// Holds the chat the user is currently talking in.
let currentChatId = null;

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
    });
    chatList.appendChild(btn);
  });
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
  await loadMyChats();

  input.value = "";
});



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