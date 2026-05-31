import { auth } from '../JS/modules/dbConfig.js';
import { getUserTasks, getUsersSavedTasks, getActiveTasks } from '../JS/modules/FS_Requests.js';
import {getMarked, renderTasks } from '../JS/modules/renderTasks.js';
import { authGuard } from './authGuard.js';

authGuard();


const userInfo = document.getElementById('userInfo');
const subheaderTitle = document.getElementById('subheaderTitle');
const subheaderIcon = document.getElementById('subheaderIcon');
const sectionWrap = document.getElementById('myProfile');
const sections = sectionWrap.querySelectorAll(".section");
const buttons = sectionWrap.querySelectorAll(".nav-knapper");

  sectionWrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-section]');
      if (!btn) return;
      const section = document.getElementById(btn.dataset.section);
      showSection(section, btn.dataset.title, btn);
  });

// Tar HTML-element og tittel som argument.
// Viser section som er mottatt
function showSection(section, title, activeButton) {
  
  // Skjuler alle section knapper siden subheaderen allerede viser aktiv side
  buttons.forEach(btn => {
    btn.style.display = 'none';
  });
  // Skjuler userInfo
    userInfo.style.display = 'none';
    section.style.display = 'block';
    setSubheaderAsBackButton(title);
}

// Motsatt av showSection, skjuler alle sections
// Gjør alle section-knappene og profilinfo synlig
function showProfile() {
    sections.forEach(view => view.style.display = 'none');
    userInfo.style.display = 'block';
    buttons.forEach(btn =>btn.style.display = 'flex');
    subheaderTitle.textContent = 'Brukerprofil';
    subheaderIcon.innerHTML = '&#9881';
    profileSubheader.classList.remove('is-back');
}  
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                       *                    
 *  Overskriften profileSubheader får klassen 'is-back' som fungerer     *
 *  som flagg for funksjonen onSubheaderClick. Den er knyttet til        *
 *  overskriften med eventlistner.                                       *
 *  onSubheaderClick kaller showProfile som skjuler alle seksjoner,      *
 *  viser alle profilknappene, endrer overskriften og fjerner klassen.   *
 *                                                                       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const profileSubheader = document.getElementById('profileSubheader');
profileSubheader.addEventListener('click', onSubheaderClick);
function onSubheaderClick() {
  if (profileSubheader.classList.contains('is-back')) {
    showProfile();
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

const acceptBtn = document.getElementById("accept-btn");
if (!acceptBtn) { console.log("No accept button to attach event listener to"); } else {
  acceptBtn.addEventListener('click', async () => {
    if (isFinished) return;
    const currentUserId = auth.currentUser?.uid;

    const taskId = task?.id;
    const taskOwnerId = task?.createdBy?.uid || task?.creatorId;
    console.log(taskOwnerId);
    if (!currentUserId || !taskId) return;

    try {
      await db.collection('tasks').doc(taskId).update({
        'assignee.pendingRequest': firebase.firestore.FieldValue.arrayUnion(currentUserId)
      });
      console.log('Added user to assignee.pendingRequest');
      addNotification(taskOwnerId, currentUserId, taskId, "request", false, "New Task Request", "You have a new task request!");

      // Hent opp oppgave eier uid
      // Lag en notifikasjon via newNotification.js modul som 
    } catch (error) {
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
    const assigneeDisplayName = await findDisplayNameByUserId(taskAssigneeId, 'brukeren');
    const taskOwnerDisplayName = await findDisplayNameByUserId(taskOwnerId, 'oppdragsgiver');

    try {
      await db.collection('tasks').doc(taskId).update({
        status: 'finished'
      });
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