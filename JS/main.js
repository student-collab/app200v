import { initMenu } from './modules/initMenu.js';
import { auth, loginAnonymously} from './modules/dbConfig.js';
import { initDevPanel } from '/JS/modules/dev-panel.js';
export const headerReady = injectHeader();

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
    await injectNav();
   
    /* * * * * * * * * * * * *
    *    Setter inn devInfo *
    * * * * * * * * * * * * */
    await injecDevOptions();
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
      }
  console.log("inserted menu");
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                                 *
 *          devInfoEL er til bruk for oss under byggeprosessen                     *
 *          Den er finner elementet id = devinfo som injisjeres av main.js         *
 *          Elementet er i html-fragments header.xml                               *
 *                                                                                 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
async function injecDevOptions() {
          
const devInfoEl = document.getElementById('devinfo');
if (devInfoEl) { initDevPanel(devInfoEl); }

// Inject toggle styles
const style = document.createElement('style');
style.textContent = `
  #devinfo-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font: inherit;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width:100%;
  }
  .toggle-track {
    display: block;
    width: 32px;
    height: 18px;
    background: #ccc;
    border-radius: 9px;
    position: relative;
    transition: background 0.2s;
  }
  #devinfo-toggle[aria-pressed="true"] .toggle-track {
    background: #4caf50;
  }
  .toggle-thumb {
    display: block;
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
  }
  #devinfo-toggle[aria-pressed="true"] .toggle-thumb {
    transform: translateX(14px);
  }
`;
document.head.appendChild(style);

// Wire up toggle button
const toggleBtn = document.getElementById('devinfo-toggle');
  if (toggleBtn && devInfoEl) {
    devInfoEl.hidden = true; // start hidden
    toggleBtn.addEventListener('click', () => {
      const isOn = toggleBtn.getAttribute('aria-pressed') === 'true';
      toggleBtn.setAttribute('aria-pressed', String(!isOn));
      devInfoEl.hidden = isOn;
    });
  }
}
 /* * * * * * * * * * * * ^^^^^^^^^^^^^^^^ * * * * * * * * * * * * * * * * * * * * *
 *                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                            *
 *                   devInfoEL slutt 
 *          Slett også JS/modules/devpanel.js                  *
 *                                                                                 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
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
  userStatus.textContent = "Innlogget";
  logInForm.classList.add('hidden');
  
}




/*
  
  // auth.signInAnonymously();
  const result = await auth.signInWithPopup(provider);
  await auth.signOut();
  return onAuthStateChanged(auth, callback);
*/

