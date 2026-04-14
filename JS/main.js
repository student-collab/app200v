import { initMenu } from './modules/initMenu.js';
import { auth} from './modules/dbConfig.js';
import { setUser } from './modules/FS_Requests.js';

document.addEventListener('readystatechange', async (e) => {
    console.log("Readystate: " + document.readyState);
    if (!document.readyState === 'complete') {return}
            const res = await fetch('/pages/html-fragments/icon-navbar.xml');
            const fetchedNav = await res.text();
            let emptyNav = document.getElementById("replaceNav");
            let newNav = document.createElement("nav");
            newNav.innerHTML = fetchedNav;
            emptyNav.parentNode.replaceChild(newNav, emptyNav);
            
            const xmlResponse = await fetch('/pages/html-fragments/login-screen.xml');
            const fetchedHeader = await xmlResponse.text();
            document.body.insertAdjacentHTML('afterbegin', fetchedHeader);
            
             initMenu();  // Loads menu  
            
              console.log("inserted menu");

              auth.onAuthStateChanged((user) => {

                      if (!user) {
                        console.log("Display login button");
                        showLoginUI();
                      } else if (user.isAnonymous) {
                        showLogOut(user);
                        showApp(user);          
                        console.log('Anonymous session');  
                      } else if (!user.emailVerified) {
                        showLogOut(user);
                        showApp(user);
                        /* showVerificationPending(user); */          
                        console.log('Signed in as', user.displayName, user.email);
                        /* show "check your email" state */
                      } else {
                        showLogOut(user);
                        showApp(user);          
                        console.log('Signed in as', user.displayName, user.email);
                        
                      }
                    });
                  });
        
  


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

//gjort om til async for å kunne kjøre wait
async function showApp(user) {
  document.getElementById('login-screen').classList.add("hidden");

   await setUser(user.uid, {
    name: user.displayName,
    email: user.email,
    phone: "",
    location: "",
    gender: ""
  });

}



/*
  
  // auth.signInAnonymously();
  const result = await auth.signInWithPopup(provider);
  await auth.signOut();
  return onAuthStateChanged(auth, callback);
*/

