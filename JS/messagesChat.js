// Author: Viktor Eliassen. Skript for messagechat-siden som åpnes når brukeren klikker på en samtale.
import { auth } from './modules/dbConfig.js';
import { getChatsForUser, getUser, listenForMessages, sendMessage } from './modules/FS_Requests.js';
import { authGuard } from './authGuard.js';

authGuard();


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

// Returnerer uid-en til den andre brukeren i samtalen
// Brukes for å finne ut hvem samtalen er med når grensesnittet skal oppdateres.
function getOtherParticipantId(chat) {
  return (chat?.participants || []).find((uid) => uid !== auth.currentUser?.uid) || null;
}

// Finner navnet som skal vises i subheaderen for samtalen.
// Henter brukere slik at UI grensesnittet kan vise et lesbart navn i stedet for en uid.
async function getChatDisplayName(chat) {
  const otherUid = getOtherParticipantId(chat);
  if (!otherUid) return chat?.id || 'Unknown';

  const users = await getUser();
  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
  return usersById[otherUid]?.name?.display || otherUid;
}


//Finner task bildet som vises i task overviewen over chat vinduet
function getTaskImageUrl(chat) {
  if (typeof chat?.taskImage === 'string' && chat.taskImage.trim()) return chat.taskImage;
  return null;
}

// Setter siden i en deaktivert/feiltilstand når samtalen ikke kan brukes.
// Brukes ved manglende URL-parametere, manglende tilgang eller utlogget bruker.
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

// Setter link til oppdraget samtalen gjelder over chatten.
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

// Holder tekstfeltet kompakt, samtidig som det støtter meldinger over flere linjer.
// Brukes etter skriving og sending for å holde høyden forutsigbar.
function autoResizeMessageInput() {
  if (!messageInput) return;

  const maxHeight = 140;
  messageInput.style.height = 'auto';

  const nextHeight = Math.min(messageInput.scrollHeight, maxHeight);
  messageInput.style.height = `${nextHeight}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

// Sender innholdet i tekstfeltet til Firestore for den aktive samtalen.
// Brukes både av sendeknappen og Enter-snarveien.
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

// Initialiserer chatsiden når autentisering er kjent.
// Validerer tilgang til samtalen, setter topptekst og starter sanntidslytting på meldinger.
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

// Startpunkt ved sidelasting: venter på Firebase-autentisering og initialiserer deretter chatten.
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setUnavailableState('You must be signed in to view this conversation.');
    return;
  }

  await initializeChatPage(user);
});

// Klikkhåndtering for sending av melding.
sendBtn?.addEventListener('click', async () => {
  await sendCurrentMessage();
});

// Tastatursnarvei: Enter sender meldinger, Shift+Enter setter lager ny linje i chat input
messageInput?.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  await sendCurrentMessage();
});

// Utvider tekstfeltet automatisk mens brukeren skriver.
messageInput?.addEventListener('input', autoResizeMessageInput);
autoResizeMessageInput();

// Trykk eller klikk på toppfeltet fungerer som tilbakeknapp til samtalelisten, aka messages.html.
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

// Sørger for at tilbakepilen vises på denne siden.
if (subheaderBackText) subheaderBackText.classList.remove('hidden');
