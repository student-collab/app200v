import { initMenu } from './modules/initMenu.js';
import { auth, loginAnonymously} from './modules/dbConfig.js';
import { setUser } from './modules/FS_Requests.js';

document.addEventListener('readystatechange', async (e) => {
    console.log("Readystate: " + document.readyState);
    if (!document.readyState === 'complete') {return}
          const res = await fetch('/pages/html-fragments/icon-navbar.xml');
          let fetchedNav = await res.text();
          let locationDOM = document.getElementById("replaceNav");
          let tempContainer = document.createElement("div");
          tempContainer.innerHTML = fetchedNav;
          let fragment = document.createDocumentFragment();

          while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
          }

          locationDOM.parentNode.replaceChild(fragment, locationDOM);
    
            
            const xmlResponse = await fetch('/pages/html-fragments/header.xml');
            const fetchedHeader = await xmlResponse.text();
            document.body.insertAdjacentHTML('afterbegin', fetchedHeader);
            
             initMenu();  // Loads menu  
            
              console.log("inserted menu");
               document.addEventListener('click', (e) => {
                            const clicked = e.target.closest('[data-role]'); 
                            
                            if (clicked?.dataset.role === 'login-trigger') {
                                showLogin();
                            } else if (!e.target.closest('[data-role="login-panel"]')) {
                                hideLogin(); 
                            }
                });

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
                  });
        
  
function showLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.toggle('hidden');
}

function hideLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.add('hidden');
}


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

