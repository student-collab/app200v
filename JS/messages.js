//Author: Viktor Eliassen
import { auth, db } from '../JS/modules/dbConfig.js';
import { createChat, sendMessage, getChatsForUser, listenForMessages, getUser, getLatestMessageForChat } from '../JS/modules/FS_Requests.js';

// Runtime state: active chat, active Firestore unsubscribe function, and cached users.
let currentChatId = null;
let stopListeningToMessages = null;
let usersById = {};
let currentChats = [];
let latestMessageByChatId = {};
let unreadCountByChatId = {};
let stopListeningToChatMetaById = {};

const LAST_READ_STORAGE_KEY = 'messages:lastReadByChatId';
let lastReadAtByChatId = loadLastReadMap();

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

let relativeTimeIntervalId = null;

function loadLastReadMap() {
  try {
    const rawValue = localStorage.getItem(LAST_READ_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function saveLastReadMap() {
  localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(lastReadAtByChatId));
}

function getTimestampMillis(createdAt) {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
  return 0;
}

function formatRelativeTime(createdAt) {
  const timestamp = getTimestampMillis(createdAt);
  if (!timestamp) return '';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) return 'now';
  if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)}m ago`;
  if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}h ago`;
  if (diffMs < 7 * dayMs) return `${Math.floor(diffMs / dayMs)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function getLatestMessageTimeLabel(chatId) {
  return formatRelativeTime(latestMessageByChatId[chatId]?.createdAt);
}

function getLatestMessageTimeMillis(chatId) {
  return getTimestampMillis(latestMessageByChatId[chatId]?.createdAt);
}

function getSortedChats(chats) {
  return [...chats].sort((chatA, chatB) => {
    const byNewestMessage = getLatestMessageTimeMillis(chatB.id) - getLatestMessageTimeMillis(chatA.id);
    if (byNewestMessage !== 0) return byNewestMessage;

    return getChatLabel(chatA).localeCompare(getChatLabel(chatB));
  });
}

function markChatAsRead(chatId, latestMessage = latestMessageByChatId[chatId]) {
  if (!chatId) return;

  const latestMessageMillis = getTimestampMillis(latestMessage?.createdAt);
  if (!latestMessageMillis && !lastReadAtByChatId[chatId]) return;

  lastReadAtByChatId[chatId] = Math.max(lastReadAtByChatId[chatId] || 0, latestMessageMillis);
  unreadCountByChatId[chatId] = 0;
  saveLastReadMap();
}

function stopChatMetaListeners() {
  Object.values(stopListeningToChatMetaById).forEach((stopListener) => {
    if (typeof stopListener === 'function') stopListener();
  });
  stopListeningToChatMetaById = {};
}

function startChatMetaListeners(chats) {
  stopChatMetaListeners();

  chats.forEach((chat) => {
    const stopListener = db.collection('chats')
      .doc(chat.id)
      .collection('messages')
      .orderBy('createdAt')
      .onSnapshot((snapshot) => {
        const messagesInChat = snapshot.docs.map((doc) => doc.data());
        const latestMessage = messagesInChat[messagesInChat.length - 1] || null;

        if (latestMessage) {
          latestMessageByChatId[chat.id] = latestMessage;
        } else {
          delete latestMessageByChatId[chat.id];
        }

        const lastReadAt = lastReadAtByChatId[chat.id] || 0;
        const unreadCount = messagesInChat.filter((message) => {
          if (message.senderId === auth.currentUser?.uid) return false;
          return getTimestampMillis(message.createdAt) > lastReadAt;
        }).length;

        unreadCountByChatId[chat.id] = unreadCount;

        if (currentChatId === chat.id) {
          markChatAsRead(chat.id, latestMessage);
        }

        renderChatList(currentChats);
      });

    stopListeningToChatMetaById[chat.id] = stopListener;
  });
}

function startRelativeTimeUpdates() {
  if (relativeTimeIntervalId) return;
  relativeTimeIntervalId = window.setInterval(() => {
    renderChatList(currentChats);
  }, 60 * 1000);
}



// Converts a uid to a readable name for UI labels.
function getUserDisplayName(uid) {
  if (uid === auth.currentUser?.uid) return 'You';
  return usersById[uid]?.name?.display || uid;
}

// Builds the chat button/title label from the other participant in the chat.
function getChatParticipantInfo(chat) {
  const otherUid = (chat.participants || []).find(uid => uid !== auth.currentUser?.uid);
  return {
    label: otherUid ? getUserDisplayName(otherUid) : chat.id,
    photoURL: usersById[otherUid]?.photoURL || ''
  };
}

function getChatLabel(chat) {
  return getChatParticipantInfo(chat).label;
}

function buildLatestMessagePreview(chatId) {
  const latestMessage = latestMessageByChatId[chatId];
  if (!latestMessage?.text) return 'No messages yet';

  const isMine = latestMessage.senderId === auth.currentUser?.uid;
  const prefix = isMine ? 'You: ' : '';
  return `${prefix}${latestMessage.text}`;
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
  const chatName = chat ? getChatParticipantInfo(chat).label : 'Unknown';

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
  markChatAsRead(chatId);
  renderChatList(currentChats);
  chatListView?.classList.add('hidden');
  chatThreadView?.classList.remove('hidden');
  setHeaderAsChat(chatId);
  startListeningToCurrentChat();
}

// Ensures we only keep one live listener: stop old listener, start new on selected chat.
function startListeningToCurrentChat() {
  stopActiveListener();
  stopListeningToMessages = listenForMessages(currentChatId, (latestMessage) => {
    if (!currentChatId) return;

    if (latestMessage) {
      latestMessageByChatId[currentChatId] = latestMessage;
    } else {
      delete latestMessageByChatId[currentChatId];
    }

    markChatAsRead(currentChatId, latestMessage);

    renderChatList(currentChats);
  });
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

  getSortedChats(chats).forEach(chat => {
    const btn = document.createElement('button');
    const avatar = document.createElement('img');
    const itemText = document.createElement('div');
    const topRow = document.createElement('div');
    const name = document.createElement('span');
    const timeAgo = document.createElement('span');
    const bottomRow = document.createElement('div');
    const preview = document.createElement('span');
    const unreadCount = document.createElement('span');
    const participantInfo = getChatParticipantInfo(chat);
    btn.type = 'button';

    if (chat.id === currentChatId) btn.classList.add('active-chat-btn');

    avatar.className = 'chat-avatar';
    avatar.src = participantInfo.photoURL;
    avatar.alt = '';

    itemText.className = 'chat-item-text';
    topRow.className = 'chat-top-row';
    bottomRow.className = 'chat-bottom-row';
    name.className = 'chat-name';
    timeAgo.className = 'chat-time-ago';
    preview.className = 'chat-preview';
    unreadCount.className = 'chat-unread-count';

    name.textContent = participantInfo.label;
    timeAgo.textContent = getLatestMessageTimeLabel(chat.id);
    preview.textContent = buildLatestMessagePreview(chat.id);
    const unreadTotal = unreadCountByChatId[chat.id] || 0;
    unreadCount.textContent = unreadTotal > 0 ? String(unreadTotal) : '';
    unreadCount.classList.toggle('hidden', unreadTotal === 0);

    topRow.appendChild(name);
    topRow.appendChild(timeAgo);
    bottomRow.appendChild(preview);
    bottomRow.appendChild(unreadCount);
    itemText.appendChild(topRow);
    itemText.appendChild(bottomRow);
    btn.appendChild(avatar);
    btn.appendChild(itemText);

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

  startRelativeTimeUpdates();

  await loadUsers();

  const chats = await getChatsForUser(auth.currentUser.uid);
  currentChats = chats;

  const latestMessages = await Promise.all(
    chats.map(async (chat) => [chat.id, await getLatestMessageForChat(chat.id)])
  );
  latestMessageByChatId = Object.fromEntries(latestMessages);

  chats.forEach((chat) => {
    if (!latestMessageByChatId[chat.id]) unreadCountByChatId[chat.id] = 0;
  });

  startChatMetaListeners(chats);

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
  if (!user) {
    stopActiveListener();
    stopChatMetaListeners();
    return;
  }
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

  const messageText = messageInput.value.trim();

  await sendMessage(currentChatId, {
    text: messageText,
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  latestMessageByChatId[currentChatId] = {
    text: messageText,
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.Timestamp.now()
  };

  markChatAsRead(currentChatId, latestMessageByChatId[currentChatId]);
  renderChatList(currentChats);

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
