//Author: Viktor Eliassen. SCRIPT FOR MESSAGES PAGE THAT SHOWS LIST OF CONVERSATIONS
import { auth } from '../JS/modules/dbConfig.js';
import { getChatsForUser, getUser } from '../JS/modules/FS_Requests.js';

// Runtime state: cached users and loaded chats.
let usersById = {};
let currentChats = [];

// Cache DOM elements once so we do not query repeatedly.
const chatList = document.getElementById('chatList');
const profileSubheader = document.getElementById('profileSubheader');
const subheaderTitle = document.getElementById('subheaderTitle');

const loadingChatsState = document.getElementById('loadingChatsState');
const noChatsActiveState = document.getElementById('noChatsActiveState');
const hasActiveChatsState = document.getElementById('hasActiveChatsState');



// Converts a uid to a readable name for UI labels.
function getUserDisplayName(uid) {
  if (uid === auth.currentUser?.uid) return 'You';
  return usersById[uid]?.name?.display || uid;
}

//builds task title and participant label so each part can be styled separately.
function getChatMeta(chat) {
  const otherUid = (chat.participants || []).find(uid => uid !== auth.currentUser?.uid);
  const taskTitle = chat?.taskTitle?.trim();
  const taskPoster = otherUid ? getUserDisplayName(otherUid) : chat.id;

  return {
    taskTitle: taskTitle || 'No task title',
    taskPoster
  };
}

function getTaskImageUrl(chat) {
  if (typeof chat?.taskImage === 'string' && chat.taskImage.trim()) return chat.taskImage;
  return null;
}

//loads users once and caches them by uid for display names.
async function loadUsers() {
  if (!auth.currentUser) return;

  const users = await getUser();
  usersById = Object.fromEntries(users.map(user => [user.id, user]));
}

//draws active chat links. Each link opens a dedicated chat page.
function renderChatList(chats) {
  if (!chatList) return;

  chatList.innerHTML = '';

  chats.forEach(chat => {
    const link = document.createElement('a');
    link.className = 'chat-list-link';
    link.href = `./messagesChat.html?chatId=${encodeURIComponent(chat.id)}`;

    const details = document.createElement('div');
    details.className = 'chat-list-details';

    const { taskTitle, taskPoster } = getChatMeta(chat);

    const taskLine = document.createElement('div');
    taskLine.className = 'chat-list-task-title';
    taskLine.textContent = taskTitle;

    const userLine = document.createElement('div');
    userLine.className = 'chat-list-user';
    userLine.textContent = `by ${taskPoster}`;

    details.append(taskLine, userLine);
    link.appendChild(details);

    const taskImageUrl = getTaskImageUrl(chat);
    if (taskImageUrl) {
      const image = document.createElement('img');
      image.className = 'chat-list-image';
      image.src = taskImageUrl;
      image.alt = chat?.taskTitle ? `Task image for ${chat.taskTitle}` : 'Task image';
      link.appendChild(image);
    }

    chatList.appendChild(link);
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

  if (subheaderTitle) subheaderTitle.textContent = 'Meldinger';
  profileSubheader?.classList.remove('is-back');

  await loadUsers();

  const chats = await getChatsForUser(auth.currentUser.uid);
  currentChats = chats;

  //if there is more than 0 chats then return hasChats TRUE
  updateChatStates(chats.length > 0);

  renderChatList(chats);
}

// Initialize the page only when auth state is ready.
auth.onAuthStateChanged((user) => {
  if (!user) return;
  refreshMessagesPage();
});
