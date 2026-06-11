// import { getMockUser } from '../JS/modules/mockUser.js';
// importerer funksjonene som skal brukes
  import {getSavedTaskIds, getTask, createChat, addNotification, getUserNotifications, getUser} from './modules/FS_Requests.js';
  import {auth, db} from './modules/dbConfig.js';

let usersCachePromise = null;

async function findDisplayNameByUserId(userId, fallbackName = 'brukeren') {
  if (!userId) return fallbackName;

  try {
    usersCachePromise = usersCachePromise || getUser();
    const users = await usersCachePromise;
    const matchedUser = Array.isArray(users)
      ? users.find((user) => user.id === userId)
      : null;

    return matchedUser?.user?.name?.display || matchedUser?.name?.display || userId;
  } catch (error) {
    console.error('Could not resolve display name:', error);
    return userId;
  }
}
  

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * * * * * * * * * * * * * * * * *
 *    id blir sendt med i URL - for hver link i 'oppgavelisten.html' sendes                               *
 *    id med etter spørsmålstegn                                                                          *
 *    i URL: http://127.0.0.1:5500/pages/postedTaskDetail.html?id=08pCAxlL9X039IbK2egl                    *
 *                                                             ^^                                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * * * * * * * * * * * * * * * * * */

  window.addEventListener('load' , ()=>{
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *  Hvis det ikke er en id der blir brukeren           *
   *  sendt til oppgavelisten for å velge oppgave        *
   *  Ellers brukes ide til å hente en oppgave           *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    
    // Leser id ut av URL-en
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        // Rediger 'other-page.html' til ønsket side
        window.location.href = '/pages/oppgaveliste.html';
        return; // Stans videre kjøring av koden
    }
    getTask(id).then((res)=>renderTask(res));
        
        console.log(id);
    });    
/* * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Hvis det ikke er en id der blir brukeren           *
 *  sendt til oppgavelisten for å velge oppgave.       *
 *  Samme hvis id ikke finnes i databasen.             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function renderTask(task) {
  if (!task){window.location.href = '/pages/oppgaveliste.html';}
  const isFinished = task?.status === 'finished';
  const app = document.getElementById("app");
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * *
  *    Setter data fra databasen inn i HTML             *
  * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const appInnerHTML =`
      <div class="header">   
        <a class="header-link header-back-link" href="oppgaveliste.html">
          <h2>← ${task.title}</h2>
        </a>
        <button id="save-btn" class="save-top-btn" type="button" aria-pressed="false" ${isFinished ? 'disabled' : ''}>🤍 Lagre</button>
      </div>

    <div class="container ${isFinished ? 'task-finished' : ''}">

      <div class="image-box">
       <img src="${task.images}" alt="Task image">
      </div>

      <div class="title-row">
        <h1>${task.title}</h1>
        <div class="rating">
          ⭐ ${task.rating}
        </div>
        
      </div>

      <div class="creator-row">
      <h4> by: ${task.createdBy?.displayName} </h4>
      </div>

      
      <div class="tags">
        <span class="tag">
          📍 ${task.location.kommune}
        </span>

        <span class="tag">
          🏷 ${task.category}
        </span>

        <span class="tag price">
          ${task.pris} kr
        </span>
      </div>

      <div class="status">
        ${task.status}
      </div>

      ${isFinished ? '<p class="finished-note">Dette oppdraget er ferdig. Handlinger er deaktivert.</p>' : ''}

      

      <div class="section">
        <h3 class="label-with-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Om oppgaven</h3>

        <p class="task-description">${task.description}</p>
      </div>

        <div class="buttons">
          <button id="contact-btn" class="contact-btn" ${isFinished ? 'disabled' : ''}>💬 Kontakt oppdragsgiver</button>
          ${task.status !== 'accepted' && !isFinished ? '<button id="accept-btn" class="accept-btn">✅ Tilby å utføre oppdraget</button>' : ''} 
          ${task.status === 'accepted' && (task?.createdBy?.uid === auth.currentUser?.uid) && !isFinished ? '<button id="taskDone-btn" class="taskDone-btn">Oppdrag er utført</button>' : ''}
        </div>

    
      
    

    </div>
  
  `;
  app.innerHTML = appInnerHTML;
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *    Legger til eventlistners på knapper som nå finnes  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const saveTask = document.getElementById("save-btn");
const disableTaskInteractions = () => {
  document.querySelectorAll('#app button').forEach((button) => {
    button.disabled = true;
  });

  const taskContainer = document.querySelector('#app .container');
  taskContainer?.classList.add('task-finished');

  const statusElement = taskContainer?.querySelector('.status');
  if (statusElement) statusElement.textContent = 'finished';

  if (taskContainer && !taskContainer.querySelector('.finished-note')) {
    const note = document.createElement('p');
    note.className = 'finished-note';
    note.textContent = 'Dette oppdraget er ferdig. Handlinger er deaktivert.';
    statusElement?.insertAdjacentElement('afterend', note);
  }
};

//setter opp attributter for hvilken state save task knappen er i
const setSaveButtonState = (isSaved) => {
  saveTask.classList.toggle('is-saved', isSaved);
  saveTask.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  saveTask.textContent = isSaved ? '❤️ Lagret' : '🤍 Lagre';
};

// On page load, sync the heart button with what is already saved in Firestore.
const hydrateSavedState = async () => {
  // No logged-in user means this task cannot be in a saved list.
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    setSaveButtonState(false);
    return;
  }

  // Fetch the user's saved tasks and mark this task as saved/unsaved in UI.
  const savedTaskIds = await getSavedTaskIds(currentUserId);
  setSaveButtonState(savedTaskIds.includes(task.id));
};

// Run once after rendering so the button reflects real saved state immediately.
hydrateSavedState();


saveTask.addEventListener('click', async ()=>{ 
  if (isFinished) return;
  // const user = getMockUser(); Har kommentert ut bruken til mockusers slik at d funker med ekte brukere
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    console.log('Ingen innlogget bruker.');
    return;
  }

  // const savedTaskIds = await getSavedTaskIds(user.uid);
  const savedTaskIds = await getSavedTaskIds(currentUserId);

  if (savedTaskIds.includes(task.id)) {
    // Fjern fra savedTaskIds
    await db.collection('users').doc(currentUserId).update({
      savedTaskIds: firebase.firestore.FieldValue.arrayRemove(task.id)
    });
    setSaveButtonState(false);
    console.log("Oppgave fjernet fra lagrede oppgaver");
  } else {
    // Legg til i savedTaskIds
    await db.collection('users').doc(currentUserId).update({
      savedTaskIds: firebase.firestore.FieldValue.arrayUnion(task.id)
    });
    setSaveButtonState(true);
    console.log("Oppgave lagt til i lagrede oppgaver");
  }


})

  //Creates a chat with between the logged in user and the poster of the task
  const contactBtn = document.getElementById('contact-btn');
  contactBtn?.addEventListener('click', async () => {
    if (isFinished) return;
    const currentUserId = auth.currentUser?.uid;
    const posterId = task?.createdBy?.uid || task?.creatorId;
    const taskImage = Array.isArray(task?.images)
      ? (task.images[0] || null)
      : (typeof task?.images === 'string' ? task.images : null);

    if (!currentUserId || !posterId || currentUserId === posterId) return;

    const participants = [currentUserId, posterId];
    const chatId = [...participants].sort().join('_');

    await createChat(chatId, participants, {
      taskId: task.id,
      taskTitle: task.title,
      taskImage
    });
    window.location.href = `./messagesChat.html?chatId=${encodeURIComponent(chatId)}`;
  });

//check if acceptbutton exist before attaching an eventlistener
const acceptBtn = document.getElementById("accept-btn");
if (!acceptBtn) { console.log("No accept button to attach event listener to"); } else {
  // Add click event listener to the accept button
  acceptBtn.addEventListener('click', async () => {
    //Prevent interaction if task is already finished
    if (isFinished) return;
    const currentUserId = auth.currentUser?.uid;

    const taskId = task?.id;
    const taskOwnerId = task?.createdBy?.uid || task?.creatorId;
    console.log(taskOwnerId);
    //stop execution if data is missing
    if (!currentUserId || !taskId) return;

    try {
      // Add the user's ID to the task's pending request list
      await db.collection('tasks').doc(taskId).update({
        'assignee.pendingRequest': firebase.firestore.FieldValue.arrayUnion(currentUserId)
      });
      console.log('Added user to assignee.pendingRequest');
      // Send a notification to the task owner about the new request
      addNotification(taskOwnerId, currentUserId, taskId, "request", false, "New Task Request", "You have a new task request!");

      // Hent opp oppgave eier uid
      // Lag en notifikasjon via newNotification.js modul som 
    } catch (error) {
      // Log any errors that occur during the update process
      console.error('Could not append pending request:', error);
    }
  });
}

const taskDoneButton = document.getElementById("taskDone-btn");
console.log("taskDoneButton:", taskDoneButton);
if (!taskDoneButton) {
  console.log("No task done button to attach event listener to");
} else {
  taskDoneButton.addEventListener('click', async () => {
    if (isFinished) return;
    console.log("click");
    const taskId = task?.id;
    const taskOwnerId = task?.createdBy?.uid || task?.creatorId;
    const taskAssigneeId = task?.assignee?.uid;
     // Fetch display names for review notifications
    const assigneeDisplayName = await findDisplayNameByUserId(taskAssigneeId, 'brukeren');
    const taskOwnerDisplayName = await findDisplayNameByUserId(taskOwnerId, 'oppdragsgiver');

    try {
      // Update task status to finished in Firestore
      await db.collection('tasks').doc(taskId).update({
        status: 'finished'
      });
      // Send review notification to the task owner and task assignee
      await addNotification(taskOwnerId, taskAssigneeId, taskId, "review", false, "Hvordan var opplevelsen?", `Gi en vurdering til ${assigneeDisplayName}`);
      await addNotification(taskAssigneeId, taskOwnerId, taskId, "review", false, "Hvordan var opplevelsen?", `Gi en vurdering til ${taskOwnerDisplayName}`);

      disableTaskInteractions();

      // Browsers usually block close() unless window was opened by script; redirect is reliable fallback.
      window.close();
      setTimeout(() => {
        window.location.href = '/pages/oppgaveliste.html';
      }, 150);
    } catch (error) {
      console.error('Could not send rating notification:', error);
    }
  });
}
  
}
