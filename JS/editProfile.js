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
const profileInfoList = document.getElementById('profileInfoList');
const profileEditForm = document.getElementById('profileEditForm');
const editInfoBtn = document.getElementById('editInfoBtn');

// Input fields used in edit mode.
const editFirstNameEl = document.getElementById('editFirstName');
const editLastNameEl = document.getElementById('editLastName');
const editEmailEl = document.getElementById('editEmail');
const editGenderEl = document.getElementById('editGender');
const editLocationEl = document.getElementById('editLocation');
const editPhoneEl = document.getElementById('editPhone');

// Runtime state:
// - currentAuthUser: the authenticated Firebase user for this session.
// - currentUserDoc: latest profile document loaded from Firestore.
// - isEditMode: tracks whether the page currently shows inputs (true) or read-only list (false).
let currentAuthUser = null;
let currentUserDoc = null;
let isEditMode = false;

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

// Normalize text input values before save:
// convert null/undefined to empty string and trim whitespace.
function cleanValue(value) {
  return (value || '').trim();
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

// Copy current values into the editable input fields.
// Called when profile data is loaded and right before entering edit mode.
function fillEditForm(userDoc, authUser) {
  editFirstNameEl.value = userDoc?.name?.first || '';
  editLastNameEl.value = userDoc?.name?.last || '';
  editEmailEl.value = userDoc?.email || authUser?.email || '';
  editGenderEl.value = userDoc?.gender || '';
  editLocationEl.value = userDoc?.location?.municipality || '';
  editPhoneEl.value = userDoc?.phone || '';
}

// Switch between read-only and edit mode in one place.
// This updates visibility + button label so UI state stays consistent.
function toggleEditMode(enableEdit) {
  isEditMode = enableEdit;
  profileInfoList.style.display = enableEdit ? 'none' : 'block';
  profileEditForm.style.display = enableEdit ? 'block' : 'none';
  editInfoBtn.textContent = enableEdit ? 'Save info' : 'Edit info';
}

// Save all editable fields back to Firestore, then sync auth displayName.
// Returns true on success, false on validation/save failure.
async function saveProfileEdits(user) {
  // Read and normalize current input values.
  const firstName = cleanValue(editFirstNameEl.value);
  const lastName = cleanValue(editLastNameEl.value);
  const email = cleanValue(editEmailEl.value);
  const gender = cleanValue(editGenderEl.value);
  const municipality = cleanValue(editLocationEl.value);
  const phone = cleanValue(editPhoneEl.value);

  // Basic validation before writing to database.
  if (!firstName || !lastName) {
    setStatus('First name and last name are required.', true);
    return false;
  }

  try {
    // Merge into existing users/{uid} document so untouched fields are kept.
    await db.collection('users').doc(user.uid).set(
      {
        email,
        gender,
        phone,
        name: {
          first: firstName,
          last: lastName,
          display: `${firstName} ${lastName}`
        },
        location: {
          municipality: municipality
        },
        meta: {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    );

    // Keep Firebase Auth displayName in sync with profile name.
    await user.updateProfile({ displayName: `${firstName} ${lastName}` });
    return true;
  } catch (error) {
    setStatus(error.message || 'Could not save profile.', true);
    return false;
  }
}

// Fetch users/{uid} from Firestore and paint the list.
// If the document is missing, renderProfile still runs with null userDoc so fallbacks appear.
async function loadProfileInfo(user) {
  try {
    const docSnap = await db.collection('users').doc(user.uid).get();
    currentUserDoc = docSnap.exists ? docSnap.data() : null;
    renderProfile(currentUserDoc, user);
    fillEditForm(currentUserDoc, user);
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
    editInfoBtn.disabled = true;
    return;
  }

  currentAuthUser = user;
  editInfoBtn.disabled = false;
  await loadProfileInfo(user);
});

// Main button behavior:
// 1) First click enters edit mode.
// 2) Next click saves form values.
// 3) On successful save, reload profile and return to read-only mode.
editInfoBtn.addEventListener('click', async () => {
  if (!currentAuthUser) {
    setStatus('Please log in to edit profile details.', true);
    return;
  }

  if (!isEditMode) {
    setStatus('');
    fillEditForm(currentUserDoc, currentAuthUser);
    toggleEditMode(true);
    return;
  }

  const saved = await saveProfileEdits(currentAuthUser);
  if (!saved) return;

  await loadProfileInfo(currentAuthUser);
  toggleEditMode(false);
  setStatus('Profile info was successfully saved.');
});
