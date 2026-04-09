import { initMenu } from './modules/initMenu.js';
import { auth} from './modules/dbConfig.js';

document.addEventListener('readystatechange', (e) => {
    console.log("Readystate: " + document.readyState);
  if (document.readyState === 'complete') {
            
            fetch('html-fragments/navbar.html')
            .then(res => res.text())
            .then(text => {
                let emptyNav = document.getElementById("replaceNav");
                let newNav = document.createElement("nav");
                newNav.innerHTML = text;
                emptyNav.parentNode.replaceChild(newNav, emptyNav);
            }).then(() => initMenu())  // Loads menu  
            .then(()=>{ 
              console.log("inserted menu");
              auth.onAuthStateChanged((user) => {

                      if (!user) {
                        console.log("Display login button");
                        showLoginUI();
                      } else if (user.isAnonymous) {
                        showApp(user);          
                        console.log('Anonymous session');  
                      } else if (!user.emailVerified) {
                        showApp(user);
                        /* showVerificationPending(user); */          
                        console.log('Signed in as', user.displayName, user.email);
                        /* show "check your email" state */
                      } else {
                        showApp(user);          
                        console.log('Signed in as', user.displayName, user.email);
                      }
                    });
              });
        
  }
})

export function showLoginUI() {
  const logInScreen = document.getElementById('login-screen');
  if(!logInScreen) console.log("login-screen not found");
  logInScreen.classList.remove("hidden");
}

function showApp(user) {
  document.getElementById('login-screen').classList.add("hidden");

}

/*
  
  // auth.signInAnonymously();
  const result = await auth.signInWithPopup(provider);
  await auth.signOut();
  return onAuthStateChanged(auth, callback);
*/

