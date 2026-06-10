// Forfatter: Viktor Eliassen. Skript for meldingssiden som viser en liste over samtaler.
import { auth } from '../JS/modules/dbConfig.js';
import { getChatsForUser, getUser } from '../JS/modules/FS_Requests.js';
import { authGuard } from './authGuard.js';

authGuard();


// Kjøretidstilstand: mellomlagrede brukere og innlastede samtaler.
let usersById = {};
let currentChats = [];

// Lagrer DOM-elementer én gang, så vi slipper gjentatte oppslag.
const chatList = document.getElementById('chatList');
const profileSubheader = document.getElementById('profileSubheader');
const subheaderTitle = document.getElementById('subheaderTitle');

const loadingChatsState = document.getElementById('loadingChatsState');
const noChatsActiveState = document.getElementById('noChatsActiveState');
const hasActiveChatsState = document.getElementById('hasActiveChatsState');



// Gjør om en uid til et lesbart navn for visning i grensesnittet.
function getUserDisplayName(uid) {
  if (uid === auth.currentUser?.uid) return 'You';
  return usersById[uid]?.name?.display || uid;
}

// Bygger opp oppdragstittel og deltakeretikett slik at delene kan styles hver for seg.
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

// Laster inn brukere én gang og mellomlagrer dem på uid for visningsnavn.
async function loadUsers() {
  if (!auth.currentUser) return;

  try {
    const users = await getUser();
    usersById = Object.fromEntries(users.map(user => [user.id, user]));
  } catch (error) {
    // Hvis Firestore-reglene nekter bred lesing av brukere, behold funksjonalitet med uid som reserve.
    console.warn('Could not load users collection (permissions):', error);
    usersById = {};
  }
}

// Tegner lenker til aktive samtaler. Hver lenke åpner en egen chatside.
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
    userLine.textContent = `${taskPoster}`;

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

// Oppdaterer hvilken UI-tilstand som skal vises, avhengig av om brukeren har en samtale.
function updateChatStates(hasChats) {
  
  // Skjul alltid lastetilstanden når samtaledata er ferdig lastet. ?. betyr at vi bare fortsetter hvis verdien finnes.
  loadingChatsState?.classList.add('hidden');

  // Hvis brukeren har minst én samtale
  if (hasChats) {
    // Vis seksjonen med aktive samtaler
    hasActiveChatsState?.classList.remove('hidden');
    // Skjul tomtilstanden for ingen samtaler
    noChatsActiveState?.classList.add('hidden');
  } else {
    // Skjul seksjonen for aktive samtaler fordi det ikke finnes noen samtaler
    hasActiveChatsState?.classList.add('hidden');

    // Vis tomtilstanden for brukere uten samtaler
    noChatsActiveState?.classList.remove('hidden');
  }
}

// Oppdaterer siden: laster brukere og samtaler, og tegner deretter grensesnittet.
async function refreshMessagesPage() {
  if (!auth.currentUser) return;

  if (subheaderTitle) subheaderTitle.textContent = 'Meldinger';
  profileSubheader?.classList.remove('is-back');

  await loadUsers();

  const chats = await getChatsForUser(auth.currentUser.uid);
  currentChats = chats;

  // Hvis det finnes mer enn 0 samtaler, send inn true til tilstandshåndteringen
  updateChatStates(chats.length > 0);

  renderChatList(chats);
}

// Initialiser siden først når autentiseringstilstanden er klar.
auth.onAuthStateChanged((user) => {
  if (!user) return;
  refreshMessagesPage();
});
