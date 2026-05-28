import { auth } from '../JS/modules/dbConfig.js';
import { getUserTasks, getUsersSavedTasks } from '../JS/modules/FS_Requests.js';
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
  
  // Skjuler alle sections, for sikkerhetsskyld, alle er skjult i utgangspunktet
  // Fint å jobbe med under kode utviklingen
  sections.forEach(view => {
    view.style.display = 'none';
    view.style.border = '2px solid coral';
  });
  
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
auth.onAuthStateChanged((user) => {
  const activeUser = user && !user.isAnonymous ? user : null;

  initUserData(activeUser);

  if (!activeUser) {
    clearTaskContainers();
    return;
  }

  initUserTaskData(activeUser.uid);
  usersSaved(activeUser.uid);
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
       "distance":0.0 // komme tilbake til - 
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
}

 /*

{
    "id":"2wv9ojnAg0gBGR0OikPf",
    "provider":"password",
    "stats":{ "tasksCompleted":2,
              "tasksPosted":4,
              "tasksInProgress":2,
              "averageRating":4.8
            },
    "savedTaskIds":[],
    "email":"ioana.ylmaz36@hotmail.com",
    "emailVerified":false,
    "photoURL":"https://api.dicebear.com/7.x/thumbs/svg?seed=ioana.ylmaz36",
    "meta":{  "createdAt":  { "seconds":1767772039,
                              "nanoseconds":66000000
                            },
              "updatedAt":{ "seconds":1767772039,
                            "nanoseconds":66000000
                          },
              "lastLoginAt":{ "seconds":1775050101,
                              "nanoseconds":968000000
                            }
            },
    "privacy":{ "gdprConsentDate":{ "seconds":1767772039,
                                    "nanoseconds":66000000
                                  },
                "deletionRequestedAt":null,
                "marketingConsent":true,
                "gdprConsent":true
              },
    "phone":"+4780498588",
    "preferences":{ "timezone":"Europe/Oslo",
                    "theme":"system",
                    "language":"nb",
                    "notifications":{ "inApp":true,
                                      "email":false
                                    }
                  },
    "name":{  "first":"Ioana",
              "last":"Yılmaz",
              "display":"Ioana Y."
            },
    "gender":"male",
    "location":{  "municipalityId":"OS-0803",
                  "lat":61.08619490192435,
                  "country":"NO",
                  "address":"Prinsens gate 41",
                  "lng":10.650729113183855,
                  "municipality":"Sagene"
                }
}

users with saved tasks: 
'0P3jGGgGxXlBv3OjgUgp', 
'0SbKZGBjvSmPwJ0nCXXy', 
'0U8uI6Hii7pzuquBEblY', 
'0gKyh67NOEvtuzHL329V', 
'1KKYm6McqxsTOngPgkz9'

[{  "id":"0P3jGGgGxXlBv3OjgUgp",
    "displayName":"Haruto S.",
    "email":"haruto.silva6@gmail.com"
  },
  { "id":"0SbKZGBjvSmPwJ0nCXXy",
    "displayName":"Fang D.",
    "email":"fang.demir131@protonmail.com"
  },
  { "id":"0U8uI6Hii7pzuquBEblY",
    "displayName":"Morgan K.",
    "email":"morgan.kowalski133@hotmail.com"
  },
  { "id":"0gKyh67NOEvtuzHL329V",
    "displayName":"Axel M.",
    "email":"axel.mohammed51@protonmail.com"
  },
  { "id":"1KKYm6McqxsTOngPgkz9",
    "displayName":"Ana P.",
    "email":"ana.pham122@yahoo.com"
  }]
  */