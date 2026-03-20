/*
Since the Google SDK implementation is outside the course scope, this portion was AI-generated
*/
import { auth } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginAnonymously() {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function onUser(callback) {
  // callback receives user or null
  return onAuthStateChanged(auth, callback);
}

/* 
// AI generated script for requiring login

import { loginWithGoogle, loginAnonymously, onUser } from './auth.js';

// Observe auth state — fires immediately on load and on every change
onUser((user) => {
  if (!user) {
    showLoginUI();
  } else if (user.isAnonymous) {
    showApp(user);          // dev shortcut — still functional
    console.log('Anonymous session');
  } else {
    showApp(user);          // real Google user
    console.log('Signed in as', user.displayName, user.email);
  }
});

// eventlistners fires the exported functions
document.getElementById('btn-google').addEventListener('click', loginWithGoogle);
document.getElementById('btn-skip').addEventListener('click', loginAnonymously);

*/

/*

Related to be used for initial testing

<div id="login-screen">
  <button id="btn-google">Sign in with Google</button>
  <button id="btn-skip">Continue without account</button>
</div>

<div id="app" hidden>
  <!-- main content -->
</div>

function showLoginUI() {
  document.getElementById('login-screen').hidden = false;
  document.getElementById('app').hidden = true;
}

function showApp(user) {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('app').hidden = false;
}


// Advises - discard when understood and checked out
A few notes

Match the Firebase SDK version string (11.0.0) to whatever you're already importing in firebase-config.js — they must match.
onAuthStateChanged is the right place to gate your UI. Never read auth.currentUser at page load synchronously — it's null until Firebase resolves the session.
Anonymous users persist across page reloads within the same browser (Firebase stores the token in IndexedDB). They're only gone if the user clears storage or you explicitly signOut.
When a dev wants to switch from anonymous → Google mid-session, look into linkWithPopup later — it merges the accounts rather than losing the anonymous session.
Enable both Google and Anonymous providers in your Firebase console under Authentication → Sign-in methods, or signInWithPopup / signInAnonymously will throw.

*/