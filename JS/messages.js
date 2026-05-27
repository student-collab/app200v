//Author: Viktor Eliassen. Reverted back to this version because it came uncontrollable.
import { auth } from '../JS/modules/dbConfig.js';
import { createChat, sendMessage, getChatsForUser, listenForMessages, getUser } from '../JS/modules/FS_Requests.js';

// Runtime state: active chat, active Firestore unsubscribe function, and cached users.
let currentChatId = null;
let stopListeningToMessages = null;
let usersById = {};
let currentChats = [];

// Cache DOM elements once so we do not query repeatedly.
const createChatSelect = document.getElementById('createChat');
const createChatBtn = document.getElementById('createChatBtn');
const chatList = document.getElementById('chatList');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const chatListView = document.getElementById('chatListView');
const chatThreadView = document.getElementById('chatThreadView');
const profileSubheader = document.getElementById('profileSubheader');
const subheaderTitle = document.getElementById('subheaderTitle');
const subheaderBackText = document.getElementById('subheaderBackText');

const loadingChatsState = document.getElementById('loadingChatsState');
const noChatsActiveState = document.getElementById('noChatsActiveState');
const hasActiveChatsState = document.getElementById('hasActiveChatsState');



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

// List mode header: generic title, no back button, normal subheader styling.
function setHeaderAsList() {
  if (subheaderTitle) subheaderTitle.textContent = 'Messages';
  subheaderBackText?.classList.add('hidden');
  profileSubheader?.classList.remove('is-back');
}

// Chat mode header: title includes the other user's name and enables back affordance.
function setHeaderAsChat(chatId) {
  const chat = currentChats.find(c => c.id === chatId);
  const chatName = chat ? getChatLabel(chat) : 'Unknown';

  if (subheaderTitle) subheaderTitle.textContent = `Chat with ${chatName}`;
  subheaderBackText?.classList.remove('hidden');
  profileSubheader?.classList.add('is-back');
}

// Default page mode: show list, hide thread, reset header to "Messages".
function showChatListView() {
  chatListView?.classList.remove('hidden');
  chatThreadView?.classList.add('hidden');
  setHeaderAsList();
}

// Safety helper: ensures there is never more than one active Firestore listener.
function stopActiveListener() {
  if (stopListeningToMessages) {
    stopListeningToMessages();
    stopListeningToMessages = null;
  }
}

// Back navigation state transition:
// clear selected chat, stop realtime updates for old chat, clear old thread UI, show list.
function backToChatList() {
  currentChatId = null;
  stopActiveListener();

  if (messages) {
    messages.innerHTML = '';
  }

  renderChatList(currentChats);
  showChatListView();
}

// Open-chat transition:
// set active chat, switch UI to thread mode, update header, then start realtime listener.
function openChat(chatId) {
  currentChatId = chatId;
  renderChatList(currentChats);
  chatListView?.classList.add('hidden');
  chatThreadView?.classList.remove('hidden');
  setHeaderAsChat(chatId);
  startListeningToCurrentChat();
}

// Ensures we only keep one live listener: stop old listener, start new on selected chat.
function startListeningToCurrentChat() {
  stopActiveListener();
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
      openChat(chat.id);
    });
    chatList.appendChild(btn);
  });
}

//updates which UI state is visible depending on whether the user is part of a chat.
function updateChatStates(hasChats) {
  
  //always hide the loading state once chat data has finished loading. ? means only continue if this value exists
  loadingChatsState?.classList.add('hidden');

  //if user has atleast one chat
  if (hasChats) {
    //show active chats selection
    hasActiveChatsState?.classList.remove('hidden');
    //hide "no chats" empty state section
    noChatsActiveState?.classList.add('hidden');
  } else {
    //hide active chats section because there are no active chats
    hasActiveChatsState?.classList.add('hidden');

    //show the empty state message for users without chats
    noChatsActiveState?.classList.remove('hidden');
  }
}

// Main page refresh: load users, load chats, select default chat, render UI, start listener.
async function refreshMessagesPage() {
  if (!auth.currentUser) return;

  await loadUsers();

  const chats = await getChatsForUser(auth.currentUser.uid);
  currentChats = chats;

  //if there is more than 0 chats then return hasChats TRUE
  updateChatStates(chats.length > 0);

  renderChatList(chats);

  // If user has no chats: force list mode and exit early.
  if (chats.length === 0) {
    backToChatList();
    return;
  }

  // Handles refreshes robustly: keep current chat open if it still exists,
  // otherwise fall back to list mode.
  const currentChatStillExists = chats.some(chat => chat.id === currentChatId);

  if (currentChatId && currentChatStillExists) {
    openChat(currentChatId);
  } else {
    backToChatList();
  }
  
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
  await refreshMessagesPage();

  if (createChatSelect) createChatSelect.selectedIndex = 0;
});

// Sends one message to the currently selected chat.
async function sendCurrentMessage() {
  if (!currentChatId || !auth.currentUser || !messageInput?.value.trim()) return;

  await sendMessage(currentChatId, {
    text: messageInput.value.trim(),
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  messageInput.value = '';
  autoResizeMessageInput();
}

function autoResizeMessageInput() {
  if (!messageInput) return;

  const maxHeight = 140;
  messageInput.style.height = 'auto';

  const nextHeight = Math.min(messageInput.scrollHeight, maxHeight);
  messageInput.style.height = `${nextHeight}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

sendBtn?.addEventListener('click', async () => {
  await sendCurrentMessage();
});

// Enter sends the message; Shift+Enter inserts a newline in the textarea.
messageInput?.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  await sendCurrentMessage();
});

messageInput?.addEventListener('input', autoResizeMessageInput);
autoResizeMessageInput();

// In chat mode, the whole subheader acts as a back control.
profileSubheader?.addEventListener('click', () => {
  if (!chatThreadView?.classList.contains('hidden')) backToChatList();
});
