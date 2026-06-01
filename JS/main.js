
import { initMenu } from './modules/initMenu.js';
import { auth, loginAnonymously} from './modules/dbConfig.js';
//export const headerReady = injectHeader();

document.addEventListener('readystatechange', async (e) => {
    console.log("Readystate: " + document.readyState);
    if (document.readyState !== 'complete') { return; }
    /* * * * * * * * * * * * *
     *    Setter inn header  * 
     * * * * * * * * * * * * */
    //await injectHeader();
    /*
         Oppgaveliste.js ser etter header-elementet
         Derfor er injectHeader exportert for at koden i 
         Oppgaveliste.js skal kunne vente på at den er ferdig
    */
    /* * * * * * * * * * * * *
    *   Setter inn navbar   *
    * * * * * * * * * * * * */
  //  await injectNav();
   
    /* * * * * * * * * * * * * * * * * * * * * * *
    *    Navbar og login får eventlistnere som   *
    *    knytter funksjoner til klikk            *
    * * * * * * * * * * * * * * * * * * * * * * **/
    initMenu();
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    *   Viser og skjuler login skjema.                                             *
    *   Eventlistner som trigges av alle klikk i dokumnetet.                       *
    *   Brukeren kan klikke hvor som helst for å skjule menyen.                    *
    *   Klikk på 'Logg inn'-> parent-element har data-role="login-trigger"         *
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/
    document.addEventListener('click', (e) => {
        const clicked = e.target.closest('[data-role]'); 
        
        if (clicked?.dataset.role === 'login-trigger') {
            showLogin();
        } else if (!e.target.closest('[data-role="login-panel"]')) {
            hideLogin(); 
        }
    });
    /* * * * * * * * * * * * * * * * * * * * * * * * * * *
    *   Om noen logger inn eller ut er trigges denne    *
    * * * * * * * * * * * * * * * * * * * * * * * * * * */
    auth.onAuthStateChanged((user) => {

            if (!user) {
              loginAnonymously();
              console.log("User logged in anonymously");
            } else if (user.isAnonymous) {
              console.log("User still logged in anonymously");
            } else if (!user.emailVerified) {
              showLogOut(user);
              console.log('Signed in as', user.displayName, user.email);
              console.log("email not verified");
            } else {
              showLogOut(user);
              showApp(user);          
              console.log('Signed in as', user.displayName, user.email);
            }
    });

}); /* Ferdig med window load */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * ** 
*    Setter inn header på alle sider - rett etter body tag åpner            * 
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
async function injectHeader(){

  const xmlResponse = await fetch('/pages/html-fragments/header.xml');
  const fetchedHeader = await xmlResponse.text();
  document.body.insertAdjacentHTML('afterbegin', fetchedHeader);
}
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
*                                                                           *
*    Setter inn navbar, meny for navigasjon, på alle sider som              * 
*    har et element med id = "replaceNav" (og main.js er linket inn)        *
*                                                                           *
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
async function injectNav(){

        let locationDOM = document.getElementById("replaceNav");
        if (locationDOM) {
          const res = await fetch('/pages/html-fragments/icon-navbar.xml');
          let fetchedNav = await res.text();
          let tempContainer = document.createElement("div");
          tempContainer.innerHTML = fetchedNav;
          let fragment = document.createDocumentFragment();

          while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
          }

          locationDOM.parentNode.replaceChild(fragment, locationDOM);
          markCurrentNavItem();
      }
  console.log("inserted menu");
}

//For marking the current active bottom nav-bar page we are on so we can paint it purple
function markCurrentNavItem() {
  const navLinks = document.querySelectorAll('#footer-menu a.nav-item');
  if (!navLinks.length) return;

  const normalizePath = (path) => (path || '/').replace(/\/+$/, '').toLowerCase() || '/';
  const currentPath = normalizePath(window.location.pathname);
  const currentFileName = currentPath.split('/').pop() || '';
  const aliases = new Set(['', 'index.html', 'index']);
  const messagesAliases = new Set(['messages.html', 'messagesChat.html', 'messageschat']);

  navLinks.forEach((link) => {
    const linkPath = normalizePath(link.getAttribute('href'));
    const linkFileName = linkPath.split('/').pop() || '';


    // Sjekk for messagesChat og postedTaskDetail med ekstra etter .html
    const isMessagesChatVariant = currentFileName.startsWith('messageschat.html');
    const isPostedTaskDetailVariant = currentFileName.startsWith('postedtaskdetail.html');

    const isMatch = currentPath === linkPath ||
      ((aliases.has(currentFileName) || isPostedTaskDetailVariant) && linkFileName === 'oppgaveliste.html') ||
      ((messagesAliases.has(currentFileName) || isMessagesChatVariant) && linkFileName === 'messages.html');

    if (isMatch) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-active');
    } else {
      link.removeAttribute('aria-current');
      link.classList.remove('is-active');
    }
  });
}


/* * * * * * * * * * * * * * * * * * * *
 *    Viser og skjuler login-skjerm    *
 * * * * * * * * * * * * * * * * * * * */

function showLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.toggle('hidden');
}

function hideLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.add('hidden');
}

//For å sette profilbilde av brukeren som er logget inn i topp høyre hjørnet ved siden av navnet
function setHeaderProfilePhoto(user) {
  const photoContainer = document.getElementById('login-symbol-background');
  const profilePhoto = document.getElementById('header-profile-photo');
  if (!photoContainer || !profilePhoto) return;

  const photoUrl = user?.photoURL || '';
  if (photoUrl) {
    profilePhoto.src = photoUrl;
    photoContainer.classList.add('has-photo');
  } else {
    profilePhoto.removeAttribute('src');
    photoContainer.classList.remove('has-photo');
  }
}

/* showLoginUI brukes av initMenu.js når noen logger av  */
export function showLoginUI() {
  const logInScreen = document.getElementById('login-screen');
  const inlogInfo = document.getElementById("inlog-info");
  inlogInfo.classList.add('hidden');
  if(!logInScreen) console.log("login-screen not found");
  logInScreen.classList.remove("hidden");
  const userStatus =  document.getElementById('usr-status');
  userStatus.textContent = "Logg inn"
  const logInForm = document.getElementById('auth-form');
  logInForm.classList.remove('hidden');
  setHeaderProfilePhoto(null);
}

function showLogOut(user){
  const logInForm = document.getElementById('auth-form');
  const userStatus =  document.getElementById('usr-status');
  
  const inlogInfo = document.getElementById("inlog-info");
  const showLoginInfo1 = document.getElementById('usr-inf1');
  const showLoginInfo2 = document.getElementById('usr-inf2');
  const showLoginInfo3 = document.getElementById('usr-inf3');

console.info(user);
showLoginInfo1.textContent = "Logget inn som: " + (user.displayName ?? "noName");
showLoginInfo2.textContent = "Brukerid: " + user.uid;
showLoginInfo3.textContent = "e-post: " + user.email;
inlogInfo.classList.remove('hidden');
console.log("ShowLogOut");
  userStatus.textContent = user.displayName ?? "Innlogget";
  logInForm.classList.add('hidden');
  setHeaderProfilePhoto(user);
  
}




/*
  
  // auth.signInAnonymously();
  const result = await auth.signInWithPopup(provider);
  await auth.signOut();
  return onAuthStateChanged(auth, callback);
*/

