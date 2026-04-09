import { registerWithEmail, loginWithGoogle, loginAnonymously, signOut, signIn} from './dbConfig.js';

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
    /* ------------------------------ Burger knapp --------------------------------- */
        const NAV_MENU = document.getElementById("navUL");
        const BURGER_BUTTON = document.getElementById("burger_button");
        const BURGER_CLOSE_IMG = document.getElementById("burger_close");
        const BURGER_BUTTON_IMG = document.getElementById("burger_stripes");
        if (!NAV_MENU) {
                                console.error('Element not found!');
                                return;
        }
        NAV_MENU.classList.add("hidden");
        
        BURGER_BUTTON.onclick = (e) => {
                                            BURGER_CLOSE_IMG.classList.toggle("hidden");
                                            BURGER_BUTTON_IMG.classList.toggle("hidden");
                                            NAV_MENU.classList.toggle("hidden");
                                            NAV_MENU.classList.toggle("slide_in");
                                            
                                        }; 

/* ------------------------------ login funksjonalitet  --------------------------------- */

const signInBtn = document.getElementById("login-Btn");
const skipLoginButton = document.getElementById("skip-login-Btn");
const ratherGoogleSignIn = document.getElementById('btn-google');
const signOutBtn = document.getElementById("sign-out");
const registerBtn  = document.getElementById('btn-register');
const toggleVisiblePassword = document.getElementById('toggle-password');
ratherGoogleSignIn.addEventListener('click', () =>  loginWithGoogle());
skipLoginButton.addEventListener('click', () => loginAnonymously());   

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

toggleVisiblePassword.addEventListener('click', () => {
  const input = document.getElementById('password');
  const btn = document.getElementById('toggle-password');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'hide';
  } else {
    input.type = 'password';
    btn.textContent = 'show';
  }
});

signOutBtn.addEventListener('click', async()=> await signOut());


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

