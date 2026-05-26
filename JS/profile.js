import { auth } from '../JS/modules/dbConfig.js';
import { getMockUser } from '../JS/modules/mockUser.js';
import { getUserTasks } from '../JS/modules/FS_Requests.js';
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
      showSection(section, btn.dataset.title);
  });

// Tar HTML-element og tittel som argument.
// Viser section som er mottatt
function showSection(section, title) {
  
  // Skjuler alle sections, for sikkerhetsskyld, alle er skjult i utgangspunktet
  // Fint å jobbe med under kode utviklingen
  sections.forEach(view => {
    view.style.display = 'none';
    view.style.border = '2px solid coral';
  });
  
  // Skjuler alle section knapper
  // buttons.forEach(btn => btn.style.display = 'none');
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
    subheaderTitle.textContent = 'My Profile';
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




/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                       *                    
 *     auth.onAuthStateChanged((user) ... er rikitg,                     * 
 *     kjøres ved page load og ved inn- og utlogging                     *
 *                                                                       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
    
        auth.onAuthStateChanged((user) => {
            const welcomeElement = document.getElementById('loadUsername');
            const profilePhoto = document.getElementById('profile-photo');

            if (user) {
                welcomeElement.textContent = `${user.displayName || 'User'}`;

                if (user.photoURL) {
                    profilePhoto.src = user.photoURL;
                } else {
                    profilePhoto.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+PHBhdGggZD0iTTYwIDBjMzMuMTQ4IDAgNjAgMjYuODUyIDYwIDYwUzE5My4xNDggMTIwIDE2MCAxMjBIMTBjLTMzLjE0OCAwLTYwLTI2Ljg1Mi02MC02MFMxNi44NTIgMCA2MCAweiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNTAiIHI9IjE4IiBmaWxsPSIjZGRkZGRkIi8+PGNpcmNsZSBjeD0iNjAiIGN5PSI4MCIgcj0iMjAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=';
                }
            } else {
                welcomeElement.textContent = 'Please log in to see your profile.';
                profilePhoto.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+PHBhdGggZD0iTTYwIDBjMzMuMTQ4IDAgNjAgMjYuODUyIDYwIDYwUzE5My4xNDggMTIwIDE2MCAxMjBIMTBjLTMzLjE0OCAwLTYwLTI2Ljg1Mi02MC02MFMxNi44NTIgMCA2MCAweiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNTAiIHI9IjE4IiBmaWxsPSIjZGRkZGRkIi8+PGNpcmNsZSBjeD0iNjAiIGN5PSI4MCIgcj0iMjAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=';
            }
        });

*/
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                       *                    
 * Midlertidig tullekode gjør det enklere å bytte bruker for testing     *
 *                                                                       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const user = getMockUser(); //importert getter fra mockUser.js
 addEventListener("DOMContentLoaded", () => { 
    initUserData();
    initUserTaskData();

 })

 function initUserData (){
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
 async function initUserTaskData (){
      const taskData = await getUserTasks(user.uid);
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
              "distance":0.0 // komme tilbake til - 
          });
      });
   const HTMLFrag = renderTasks(dataSelect);
      document.getElementById("myTasks").appendChild(HTMLFrag);
  
 }