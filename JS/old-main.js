import { initMenu } from './modules/initMenu.js';
import { auth } from './modules/dbConfig.js';
import { setUser } from './modules/FS_Requests.js';

document.addEventListener('readystatechange', async () => {
  if (document.readyState !== 'complete') return;

  const cached = sessionStorage.getItem("navUL");
  if (cached) {
    document.body.insertAdjacentHTML('afterbegin', cached);
  } else {
    const res = await fetch('html-fragments/navbar.html');
    const html = await res.text();
    sessionStorage.setItem("navUL", html);
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  initMenu();

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      showLoginUI();
    } else {
      await showApp(user);
    }
  });
});

export function showLoginUI() {
  const logInScreen = document.getElementById('login-screen');
  if (!logInScreen) { console.warn('login-screen not found'); return; }
  logInScreen.classList.remove('hidden');
}

async function showApp(user) {
  document.getElementById('login-screen').classList.add('hidden');

  await setUser(user.uid, {
    name: user.displayName,
    email: user.email,
    phone: '',
    location: '',
    gender: ''
  });
}