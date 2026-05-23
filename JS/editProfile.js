//Author: Viktor Eliassen
// Edit Profile (read-only view)
// Purpose:
// 1) Wait for a logged-in user.
// 2) Read users/{uid} from Firestore.
// 3) Render Email, Gender, Location, First Name, Last Name, and Phone in the page list.
// 4) Show clear status messages and safe fallbacks when data is missing.

// Firebase Auth gives us the currently logged-in user.
// Firestore gives us the user profile document.
import { auth, db } from './modules/dbConfig.js';

// DOM targets: each span receives one profile value.
const profileEmailEl = document.getElementById('profileEmail');
const profileGenderEl = document.getElementById('profileGender');
const profileLocationEl = document.getElementById('profileLocation');
const profileFirstNameEl = document.getElementById('profileFirstName');
const profileLastNameEl = document.getElementById('profileLastName');
const profilePhoneEl = document.getElementById('profilePhone');
const statusEl = document.getElementById('formStatus');

// Show a status message below the list.
// isError=false -> green success/info color
// isError=true  -> red error color
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b00020' : '#0b7a3b';
}

// Convert null/undefined/empty values to a readable placeholder.
// This avoids blank fields in the UI and makes missing data explicit.
function safeValue(value) {
  if (value === null || value === undefined || value === '') return 'Not set';
  return String(value);
}

// Render all requested fields into the HTML list.
// Name is split into first and last from Firestore fields.
function renderProfile(userDoc, authUser) {
  profileEmailEl.textContent = safeValue(userDoc?.email || authUser?.email);
  profileGenderEl.textContent = safeValue(userDoc?.gender);
  profileLocationEl.textContent = safeValue(userDoc?.location?.municipality);
  profileFirstNameEl.textContent = safeValue(userDoc?.name?.first);
  profileLastNameEl.textContent = safeValue(userDoc?.name?.last);
  profilePhoneEl.textContent = safeValue(userDoc?.phone);
}

// Fetch users/{uid} from Firestore and paint the list.
// If the document is missing, renderProfile still runs with null userDoc so fallbacks appear.
async function loadProfileInfo(user) {
  try {
    const docSnap = await db.collection('users').doc(user.uid).get();
    const userDoc = docSnap.exists ? docSnap.data() : null;
    renderProfile(userDoc, user);
  } catch (error) {
    setStatus(error.message || 'Could not load profile data.', true);
  }
}

// Entry point:
// onAuthStateChanged runs once on load and again whenever auth state changes.
// - Logged out: show error status + "Not set" placeholders.
// - Logged in: fetch and render profile data.
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setStatus('Please log in to view profile details.', true);
    renderProfile(null, null);
    return;
  }

  await loadProfileInfo(user);
});
