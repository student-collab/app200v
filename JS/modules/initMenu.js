import { loginWithGoogle, signOut, signIn, db } from './dbConfig.js';
import{showLoginUI} from '/JS/main.js';

/**
 * 
 *  initMenu blir kjørt (called) fra main.js som er tenkt implementert på alle sider 
 *  Menyen (HTML-struktur) blir hentet (fetched) i main.js og initMenu blir kjørt først når menyen er hentet.
 *  
 *  initMenu setter legger til eventlistnere som knytter funksjoner til klikk i menyen.
 *  Funksjonenen er definert i Config.js
 * 
 */

export function initMenu(){
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                         *
 *  Finnes menyen? ellers avbryt                           *
 *                                                         * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */    
        const NAV_MENU = document.getElementById("footer-menu");
        if (!NAV_MENU) {
                                console.error('main navbar missing');
                                return;
        }
    
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                       *
 *  Finnes også log-in-screen? - ellers avbryt           *
 *                                                       * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */    


 const LOGIN_SCREEN = document.getElementById("auth-form");
        if (!LOGIN_SCREEN) {
                                console.error('login form not found!');
                                return;
        }
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Elementer brukt i JavaScript: form, knapper, input   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */    
const form = document.getElementById('auth-form');
const signInBtn = document.getElementById('login-Btn');
const ratherGoogleSignIn = document.getElementById('btn-google');
const signOutBtn = document.getElementById('sign-out');
const registerBtn  = document.getElementById('btn-register');
const eyeSymbol = document.getElementById('toggle-password');
const passwordInputField = document.getElementById('password');
const emailInputField = document.getElementById('email');
const clearFields = document.getElementById('clear-fields');
const eyeStroke = document.getElementById('eye-stroke');
const loadAnim = document.getElementById('loading-animation');

// Google sign-in does auth only.
// We also need a profile document in users/{uid} for the app to work.
// If users/{uid} is missing, send the user to register page in
// "complete profile" mode instead of leaving them half-registered.
async function signInWithGoogleAndRoute() {
  const user = await loginWithGoogle();
  if (!user) return;

  // Firebase UID is used as document id in users collection.
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists) {
    window.location.href = '/pages/register.html?completeProfile=1';
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Deaktiverer input og knapp, viser animasjon.  *
 * * * * * * * * * * * * * * * * * * * * * * * * * */
function showLoading(){
  loadAnim.classList.add('loading-active');
  emailInputField.disabled=true;
  passwordInputField.disabled=true;
  registerBtn.disabled=true;
  setTimeout(() => { 
    emailInputField.disabled=false;
    passwordInputField.disabled=false;
    registerBtn.disabled=false;
    loadAnim.classList.remove('loading-active');
  }, 2000);
}

signInBtn.addEventListener('click', async ()=>{
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!(email || password)){form.reportValidity(); return;}
  showLoading(); 

  try {
await signIn(email, password);
      } catch (error) {
            console.log("Got error: " + error.message)
            console.error(error);
      }
});

clearFields.addEventListener('click', ()=> LOGIN_SCREEN.reset());

eyeSymbol.addEventListener('mousedown', showUsrInput);
eyeSymbol.addEventListener('mouseup', hideUsrInput);
eyeSymbol.addEventListener('mouseleave', hideUsrInput);


eyeSymbol.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents potential unwanted behaviors like scrolling
    showUsrInput();
});
eyeSymbol.addEventListener('touchend', hideUsrInput);

ratherGoogleSignIn.addEventListener('click', async (e) => {
  e.preventDefault(); 
  try {
    // Single entry point for Google login + profile existence check.
    await signInWithGoogleAndRoute();
  } catch (error) {
    console.log('Google sign-in failed:', error?.message || error);
    console.error(error);
  }
});


function hideUsrInput () {
  passwordInputField.type = 'password';
  eyeStroke.classList.remove('eye-open');
}

function showUsrInput () {
  passwordInputField.type = 'text';
  eyeStroke.classList.add('eye-open');
  
}



if (signOutBtn) {
  
  signOutBtn.addEventListener('click', async()=> {
    LOGIN_SCREEN.reset();
    await signOut();
    const LoginInfo = document.querySelectorAll("span");
    LoginInfo.forEach(info=>info.textContent="");
    showLoginUI();
    
  });

}


registerBtn.addEventListener('click', (event) => {
  event.preventDefault(); //cancels browser's default action for this event
  window.location.href = '/pages/register.html';
});


}
