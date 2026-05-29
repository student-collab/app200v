import { db, storage, auth } from './dbConfig.js'; 

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
async function getUser() {
  
        const querySnapshot = await db.collection('users').get();

        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
}

async function getUsersSavedTasks(uid){
const userDoc = await db.collection('users').doc(uid).get();
const savedTaskIds = userDoc.data().savedTaskIds;

if (!savedTaskIds?.length) return [];
const snapshot = await db.collection('tasks')
  .where(firebase.firestore.FieldPath.documentId(), 'in', savedTaskIds)
  .get();
return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function getUserTasks(createdByUID) {
 const snap = await db.collection('tasks')
 .where("createdBy.uid", "==", createdByUID)
 .get();
 return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
async function getSavedTaskIds(uid) {
  const doc = await db.collection('users').doc(uid).get();

  if (!doc.exists) {
    console.warn('User not found:', uid);
    return [];
  }

  return doc.data().savedTaskIds ?? [];
}

async function getTask(taskId = "") {
    if(taskId == ""){
        console.log("getTask without taskId");
        const querySnapshot = await db.collection('tasks').get();
        
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
    }
    else{
      console.log("taskId = " + taskId);

          const snap = await db.collection('tasks').doc(taskId).get();
          if (!snap.exists) return null;
          return { id: snap.id, ...snap.data() };
        }
  }

  async function uploadImage(file, taskId) {
    const storageRef = storage.ref(`tasks/${taskId}/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    return snapshot.ref.getDownloadURL();
}

async function setTask(taskId, data, imageFiles = []) {

  let resolvedId = taskId;
  if (taskId !== "") {
    await db.collection('tasks').doc(taskId).set(data);
  } else {
     const docRef = await db.collection('tasks').add(data);
    resolvedId = docRef.id;
  }

  if (imageFiles.length > 0) {
    const urls = await Promise.all(
      imageFiles.map(file => uploadImage(file, resolvedId))
    );

    await db.collection('tasks').doc(resolvedId).update({
      images: urls
    });
  }

  return resolvedId;
}

  async function updateTask(taskId, changes) {
    await db.collection('tasks').doc(taskId).update(changes);
  }

  async function deleteTask(taskId) {
    await db.collection('tasks').doc(taskId).delete();
  }

  async function clearField(taskId, fieldName) {
    await db.collection('tasks').doc(taskId).update({
      [fieldName]: firebase.firestore.FieldValue.delete()
    });
  }




export async function readFSdb(path = 'collection/document') {
  
  const segments = path.split('/').filter(Boolean);

  // Odd segments = document, even = collection
  if (segments.length % 2 === 1) {
   const snap = await db.collection(path).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    const snap = await db.doc(path).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }
}

export {getSavedTaskIds, getUsersSavedTasks, getUserTasks, getUser, getTask, setTask, updateTask, deleteTask, clearField};

//Oppretter eller oppdaterer en bruker i 'users' collection i Firestore
export async function setUser(userId, data) { //userId= Firebase Authenticator ID
                                              //data = objektet med ting man vil lagre

  await db.collection('users').doc(userId).set(data, { merge: true }); //merge gjør at vi ikke sletter eksisterende data. //set skriver data til firestore
}


//------------------- CHAT FUNKSJONER --------------------------------

//Creates or updates a chat document with participants and optional task context.
export async function createChat(chatId, participants, metadata = {}) {
  const payload = {
    participants
  };

  if (metadata.taskId) payload.taskId = metadata.taskId;
  if (metadata.taskTitle) payload.taskTitle = metadata.taskTitle;
  if (metadata.taskImage) payload.taskImage = metadata.taskImage;

  await db.collection('chats').doc(chatId).set(payload, { merge: true });
}

// Adds one message document inside chats/{chatId}/messages.
export async function sendMessage(chatId, message) {
  await db.collection('chats')
    .doc(chatId)
    .collection('messages')
    .add(message);
}

// Returns all chats where the given userId is in the participants array.
export async function getChatsForUser(userId) {
  const snap = await db.collection('chats')
    .where('participants', 'array-contains', userId)
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Formats a Firestore timestamp for display; shows a placeholder while pending.
//function formatMessageTime(createdAt) {
  //return createdAt?.toDate ? createdAt.toDate().toLocaleString() : 'Sending..';
//}

// Formats a Firestore timestamp for display and shows a placeholder while pending.
function formatMessageTime(createdAt) {
  return createdAt?.toDate ? createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Sending..'; //datestyle short to avoid displaying seconds
}

// Replacing these symbols with text ensures that users can't run code (HTML/JS injection) using the chatbox input. This is a huge security risk so that's why we're doing this:
function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
    //g makes all characters get replaced, not only the first
}

// Preserves line breaks from textarea input in rendered chat bubbles.
function formatMessageText(text = '') {
  return escapeHtml(text).replace(/\r\n|\n|\r/g, '<br>');
}

// Builds the empty-chat message: "This is the start of your conversation with x".
async function getConversationStartText(chatId) {
  const fallbackText = 'This is the start of your conversation.';

  try {
    const chatSnap = await db.collection('chats').doc(chatId).get();
    if (!chatSnap.exists) return fallbackText;

    const participants = chatSnap.data()?.participants || [];
    const otherUserId = participants.find(uid => uid !== auth.currentUser?.uid);
    if (!otherUserId) return fallbackText;

    const otherUserSnap = await db.collection('users').doc(otherUserId).get();
    const displayName = otherUserSnap.exists ? (otherUserSnap.data()?.name?.display || otherUserId) : otherUserId;

    return `This is the start of your SideQuest with ${displayName}`;
  } catch {
    return fallbackText;
  }
}



// Builds a uid -> displayName map for all senders present in this snapshot.
// This avoids querying the same user document multiple times in one render pass.
async function getSenderNamesFromSnapshot(snapshot) {
  const senderIds = [...new Set(snapshot.docs.map(doc => doc.data()?.senderId).filter(Boolean))];

  const senderNameEntries = await Promise.all(
    senderIds.map(async (uid) => {
      const userSnap = await db.collection('users').doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() : null;
      return [uid, userData?.name?.display || uid];
    })
  );

  return Object.fromEntries(senderNameEntries);
}

// Converts all message docs into one HTML string for a single DOM update.
function buildMessagesHtml(snapshot, senderNames) {
  return snapshot.docs.map((doc) => {
    const msg = doc.data();
    const senderName = escapeHtml(senderNames[msg.senderId] || msg.senderId || 'Unknown');
    const timeStamp = formatMessageTime(msg.createdAt);
    const messageText = formatMessageText(msg.text || '');

    //for figuring out if the message is from the logged in user or the counterpart. For use in CSS styling
    const isMine = msg.senderId === auth.currentUser?.uid;
    const messageClass = isMine ? 'message-box message-mine' : 'message-box message-other';

    return `
     <div class="timeStamp">
     ${timeStamp}
     </div>
      <div class="${messageClass}">
        <strong>${senderName}</strong>: <span class="message-text">${messageText}</span>
      </div>
    `;
  }).join('');
}

// Listen for messages in real time.
//
// How it works (high level):
// 1) Build a Firestore query for chats/{chatId}/messages ordered by createdAt.
// 2) Attach onSnapshot so Firestore pushes an initial snapshot + every later change.
// 3) Convert snapshot docs to HTML and paint the #messages container.
//
// Important: onSnapshot returns an unsubscribe function. The caller stores and calls
// that function before starting a new listener, so only one active chat listener runs.
export function listenForMessages(chatId) {
  // Guard: if chatId is missing, return a safe no-op unsubscribe function.
  // This keeps caller code simple because it can always call "stopListening()".
  if (!chatId) return () => {};

  // Snapshot callbacks are async here (we await sender-name lookups).
  // If snapshot B starts after snapshot A, B should win.
  // Using renderVersion solves a bug where the chat would disappear for 1 second after painting a message, and later duplicating the painted messages in the chat if sending one more message.
  let renderVersion = 0;
  const conversationStartTextPromise = getConversationStartText(chatId);

  return db.collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt')
    .onSnapshot(async (snapshot) => {
      // Unique version for this callback invocation.
      // Any newer callback increments renderVersion and invalidates older work.
      const versionAtStart = ++renderVersion;

      // Messages are rendered into <div id="messages"> on the page.
      const messagesDiv = document.getElementById('messages');
      if (!messagesDiv) return;

      // Render a start-of-conversation text when the chat has no messages yet.
      if (snapshot.empty) {
        const conversationStartText = await conversationStartTextPromise;

        // Race-condition guard after await.
        if (versionAtStart !== renderVersion) return;

        messagesDiv.innerHTML = `<div class="timeStamp">${escapeHtml(conversationStartText)}</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return;
      }

      // Resolve sender display names (uid -> name) for all senders in this snapshot.
      const senderNames = await getSenderNamesFromSnapshot(snapshot);

      // Race-condition guard:
      // If a newer snapshot started while we were awaiting, skip this older render. TO AVOID FLICKER AND DUPLICATE CHATBOX
      if (versionAtStart !== renderVersion) return;

      // Single DOM write for the whole snapshot to reduce flicker.
      // This is the exact line that makes incoming messages appear visually.
      messagesDiv.innerHTML = buildMessagesHtml(snapshot, senderNames);

      //Keep chat scroll pinned to latest message whenever snapshot updates.
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

    });
}

/**
 * 
 *          Senere - query 
 * 
 * * * * * * * * * * * * * * 
 *
 *        Full example
 * 
            const q = query(
            collection(db, 'tasks'),
            where('status', '==', 'active'),
            where('priority', '>=', 2),
            orderBy('dueDate', 'asc'),
            limit(20)
            );

            const snap = await getDocs(q);
 *
 *
 * * * * * * * * * * * * * * * * * * * * * */

/*
await getDocs(query(collection(db, 'tasks'), where('status', '==', 'active')));

where('status', '==', 'active')      // equals
where('priority', '!=', 'low')       // not equals
where('count', '<', 10)              // less than
where('count', '<=', 10)             // less than or equal
where('count', '>', 5)               // greater than
where('count', '>=', 5)              // greater than or equal

where('tags', 'array-contains', 'urgent')     // contains value in array
where('tags', 'array-contains-any', ['urgent', 'important'])  // any of these
where('category', 'in', ['work', 'personal']) // field matches any in list

query(
  collection(db, 'tasks'),
  where('status', '==', 'active'),
  where('priority', '>', 3),
  orderBy('dueDate', 'asc'),
  limit(10)
)

orderBy('dueDate', 'asc')   // sort ascending
orderBy('dueDate', 'desc')  // sort descending
limit(10)                   // limit results
startAfter(lastDoc)         // pagination
startAt(value)              // start from value
endAt(value)                // end at value


*/