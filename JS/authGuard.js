
//Sender bruker til login.html hvis dem ikke er logget inn
import { auth } from './modules/dbConfig.js';

export function authGuard() {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user || user.isAnonymous) {
      window.location.replace("/pages/login.html");
      return;
    }

    document.body.style.display = "block";
    unsubscribe(); /*slutt å hør på authstatechanged*/
  });
}
