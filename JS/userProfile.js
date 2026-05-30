import { auth } from '../JS/modules/dbConfig.js';
import { getUserTasks, getUsersSavedTasks, getActiveTasks } from '../JS/modules/FS_Requests.js';
import { renderTasks } from '../JS/modules/renderTasks.js';


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
}
function setSubheaderAsBackButton(title) {
  subheaderTitle.textContent = title;
  subheaderIcon.textContent = '←';
  profileSubheader.classList.add('is-back');
}


auth.onAuthStateChanged((user) => {
  const activeUser = user && !user.isAnonymous ? user : null;

  initUserData(activeUser);

  if (!activeUser) {
    clearTaskContainers();
    return;
  }

  initUserTaskData(activeUser.uid);
  usersSaved(activeUser.uid);
  usersActiveTasks(activeUser.uid);
});
/**
 * 
 * Kan brukes senere også, setter inn info om brukeren 
 * 
 */
 function initUserData(user){
      const welcomeElement = document.getElementById('loadUsername');
      const profilePhoto = document.getElementById('profile-photo');
      const placeholderPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0'
      +'iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iM'
      +'TIwIiB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+PHBhdGggZD0iTTYwIDBjMzMuMTQ4IDA'
      +'gNjAgMjYuODUyIDYwIDYwUzE5My4xNDggMTIwIDE2MCAxMjBIMTBjLTMzLjE0OCAwL'
      +'TYwLTI2Ljg1Mi02MC02MFMxNi44NTIgMCA2MCAweiIgZmlsbD0iI2ZmZiIvPjxjaXJ'
      +'jbGUgY3g9IjYwIiBjeT0iNTAiIHI9IjE4IiBmaWxsPSIjZGRkZGRkIi8+PGNpcmNsZ'
      +'SBjeD0iNjAiIGN5PSI4MCIgcj0iMjAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=';
      welcomeElement.textContent = user?
      `${user.displayName || 'User'}`
      :'Logg inn for å se din profil';
      //Det er litt sent å spørre om bruker her? Kunne nektet tilgang uten bruker...
      profilePhoto.src = user.photoURL?user.photoURL:placeholderPhoto; 
 }
 /**
  * 
  * Henter ut oppgaver laget av brukeren
  * 
  */
 function filterData(taskData){

   let dataSelect = [];
   taskData.forEach(task => {
     dataSelect.push({   
       "id":task.id,
       "title":task.title,
       "pris":task.pris,
       "kommune":task.location.kommune,
       "kategori":task.category,
       "rating":task.rating,
       "urgent":task.urgent,
       "distance":0.0, // komme tilbake til - 
       "images": task.images // Legg til bilder
      });
    });
    return dataSelect;
  }
 async function initUserTaskData (userUid){
   const taskData = await getUserTasks(userUid);
   const dataSelect = filterData(taskData);
   const HTMLFrag = renderTasks(dataSelect);
   const ownTasksContainer = document.getElementById("own-tasks");
   ownTasksContainer.replaceChildren();
   ownTasksContainer.appendChild(HTMLFrag);
   lucide.createIcons();
  
 }
/**
 * Henter ut aktive oppgaver for brukeren (der bruker er eier eller assignee)
 */
async function usersActiveTasks(userUid) {
  const taskData = await getActiveTasks(userUid);
  // Sett isMine=true for egne oppgaver
  taskData.forEach(task => {
    if (task.createdBy && task.createdBy.uid === userUid) {
      task.isMine = true;
    }
  });

  const dataSelect = filterData(taskData);
  // Kopier isMine over til dataSelect
  dataSelect.forEach(ds => {
    const original = taskData.find(t => t.id === ds.id);
    if (original && original.isMine) ds.isMine = true;
  });

  const HTMLFrag = renderTasks(dataSelect);
  const activeTasksContainer = document.getElementById("active-tasks");
  if (activeTasksContainer) {
    activeTasksContainer.replaceChildren();
    activeTasksContainer.appendChild(HTMLFrag);
    lucide.createIcons();
  }
}
/**
 * 
 * Henter ut oppgaver brukeren har lagret
 * 
 * 
 */

async function usersSaved(userUid){
  const taskData = await getUsersSavedTasks(userUid);
  const dataSelect = filterData(taskData);
  const HTMLFrag = renderTasks(dataSelect);
  const savedTasksContainer = document.getElementById("saved-tasks");
  savedTasksContainer.replaceChildren();
  savedTasksContainer.appendChild(HTMLFrag);
  lucide.createIcons();
}

function clearTaskContainers() {
  document.getElementById("own-tasks")?.replaceChildren();
  document.getElementById("saved-tasks")?.replaceChildren();
  document.getElementById("active-tasks")?.replaceChildren();
}

const editProfileButton = document.querySelector('.editProfileBtn');
editProfileButton?.addEventListener('click', () => {
  window.location.href = 'editProfile.html';
});

 