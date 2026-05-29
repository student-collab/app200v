// Author: Viktor Eliassen. SCRIPT FOR THE MESSAGESCHAT PAGE THAT IS GENERATED WHEN CLICKING A CHAT
import { auth } from './modules/dbConfig.js';
import { getChatsForUser, getUser, listenForMessages, sendMessage } from './modules/FS_Requests.js';



const subheaderTitle = document.getElementById('subheaderTitle');
const subheaderBackText = document.getElementById('subheaderBackText');
const profileSubheader = document.getElementById('profileSubheader');
const chatTaskLinkBox = document.getElementById('chatTaskLinkBox');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const chatStatus = document.getElementById('chatStatus');

const params = new URLSearchParams(window.location.search);
const currentChatId = params.get('chatId');

let stopListeningToMessages = null;

// Returns the other user's uid in a 1-to-1 chat.
// Used to decide who the conversation is with when showing UI labels.
function getOtherParticipantId(chat) {
  return (chat?.participants || []).find((uid) => uid !== auth.currentUser?.uid) || null;
}

// Resolves the chat title name shown in the header.
// It fetches users so the UI can show a readable display name instead of a uid.
async function getChatDisplayName(chat) {
  const otherUid = getOtherParticipantId(chat);
  if (!otherUid) return chat?.id || 'Unknown';

  const users = await getUser();
  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
  return usersById[otherUid]?.name?.display || otherUid;
}


function getTaskImageUrl(chat) {
  if (typeof chat?.taskImage === 'string' && chat.taskImage.trim()) return chat.taskImage;
  return null;
}

// Puts the page in a disabled/error state when chat cannot be used.
// Used for missing URL params, unauthorized access, or signed-out users.
function setUnavailableState(text) {
  if (chatStatus) {
    chatStatus.textContent = text;
    chatStatus.classList.remove('hidden');
  }

  if (messages) {
    messages.innerHTML = '';
  }

  if (sendBtn) sendBtn.disabled = true;
  if (messageInput) messageInput.disabled = true;

  chatTaskLinkBox?.classList.add('hidden');
}

//setter link til task det gjelder over chatten
function setTaskLink(chat) {
  const taskId = chat?.taskId;
  if (!taskId || !chatTaskLinkBox) {
    chatTaskLinkBox?.classList.add('hidden');
    return;
  }

  const taskTitle = chat?.taskTitle?.trim() || 'Vis oppgaven';
  const taskImageUrl = getTaskImageUrl(chat);

  chatTaskLinkBox.href = `./postedTaskDetail.html?id=${encodeURIComponent(taskId)}`;

  chatTaskLinkBox.innerHTML = '';

  const title = document.createElement('span');
  title.className = 'chat-task-link-title';
  title.textContent = taskTitle;
  chatTaskLinkBox.appendChild(title);

  if (taskImageUrl) {
    const image = document.createElement('img');
    image.className = 'chat-task-link-image';
    image.src = taskImageUrl;
    image.alt = `Bilde for oppgaven ${taskTitle}`;
    chatTaskLinkBox.appendChild(image);
  }

  chatTaskLinkBox.classList.remove('hidden');
}

// Keeps the message textarea compact while still allowing multi-line messages.
// Used after typing and after sending to keep input height predictable.
function autoResizeMessageInput() {
  if (!messageInput) return;

  const maxHeight = 140;
  messageInput.style.height = 'auto';

  const nextHeight = Math.min(messageInput.scrollHeight, maxHeight);
  messageInput.style.height = `${nextHeight}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

// Sends the current input value to Firestore for the active chat.
// Used by both the Send button and Enter-key shortcut.
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

// Boots the chat page once auth is known.
// Validates chat access, sets the header title, then starts realtime message listening.
async function initializeChatPage(user) {
  if (!currentChatId) {
    setUnavailableState('Missing chatId in URL. Open a chat from the messages list.');
    return;
  }

  const chats = await getChatsForUser(user.uid);
  const activeChat = chats.find((chat) => chat.id === currentChatId);

  if (!activeChat) {
    setUnavailableState('You do not have access to this conversation.');
    return;
  }

  const chatName = await getChatDisplayName(activeChat);
  if (subheaderTitle) subheaderTitle.textContent = `Samtale med ${chatName}`;
  setTaskLink(activeChat);

  if (chatStatus) chatStatus.classList.add('hidden');

  stopListeningToMessages = listenForMessages(currentChatId);
}

// Entry point for page load: waits for Firebase auth and then initializes chat.
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setUnavailableState('You must be signed in to view this conversation.');
    return;
  }

  await initializeChatPage(user);
});

// Click handler for sending a message.
sendBtn?.addEventListener('click', async () => {
  await sendCurrentMessage();
});

// Keyboard shortcut: Enter sends, Shift+Enter inserts a newline.
messageInput?.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  await sendCurrentMessage();
});

// Auto-grow textarea as user types.
messageInput?.addEventListener('input', autoResizeMessageInput);
autoResizeMessageInput();

// Header tap/click acts as back navigation to conversation list.
profileSubheader?.addEventListener('click', () => {
  window.location.href = './messages.html';
});

// Cleanup realtime listener so we do not leave orphan subscriptions.
window.addEventListener('beforeunload', () => {
  if (stopListeningToMessages) {
    stopListeningToMessages();
    stopListeningToMessages = null;
  }
});

// Ensure the back arrow is visible on this page.
if (subheaderBackText) subheaderBackText.classList.remove('hidden');
