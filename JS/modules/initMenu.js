import { registerWithEmail, loginWithGoogle, signOut, signIn} from './dbConfig.js';
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
    
        const NAV_MENU = document.getElementById("footer-menu");
        if (!NAV_MENU) {
                                console.error('main navbar missing');
                                return;
        }
    
/* ------------------------------ login funksjonalitet  --------------------------------- */
 const LOGIN_SCREEN = document.getElementById("auth-form");
        if (!LOGIN_SCREEN) {
                                console.error('login form not found!');
                                return;
        }


const signInBtn = document.getElementById("login-Btn");
const ratherGoogleSignIn = document.getElementById('btn-google');
const signOutBtn = document.getElementById("sign-out");
const registerBtn  = document.getElementById('btn-register');
const eyeSymbol = document.getElementById('toggle-password');
const input = document.getElementById('password');
const clearFields = document.getElementById("clear-fields");
const eyeStroke = document.getElementById('eye-stroke');

ratherGoogleSignIn.addEventListener('click', () =>  loginWithGoogle());

ratherGoogleSignIn.addEventListener('click', (e) => {
  e.preventDefault(); 
  loginWithGoogle();
});

signInBtn.addEventListener('click', async ()=>{
    
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
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



function hideUsrInput () {
  input.type = 'password';
  eyeStroke.classList.remove('eye-open');
}

function showUsrInput () {
  input.type = 'text';
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


registerBtn.addEventListener('click', async () => {
  const form = document.getElementById('auth-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }


  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
 
   try {
    await registerWithEmail(email, password);
    // user is now signed in but unverified
    } catch (error) {
        console.log("Got error: " + error.message)
        console.error(error);
    }

});


}
