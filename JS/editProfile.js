//Author: Viktor Eliassen
// Edit Profile (read-only view)
// Purpose:
// 1) Wait for a logged-in user.
// 2) Read users/{uid} from Firestore.
// 3) Render Email, Gender, Location, First Name, Last Name, and Phone in the page list.
// 4) Show clear status messages and safe fallbacks when data is missing.
//
// Page modes:
// - View mode: list values are visible.
// - Edit mode: form inputs are visible.
//
// Data sources:
// - Firestore users/{uid}: canonical profile data used by this page.
// - Firebase Auth user: fallback for email/display name and sync target for displayName.

// Firebase Auth gives us the currently logged-in user.
// Firestore gives us the user profile document.
import { auth, db } from './modules/dbConfig.js';

// DOM targets: each span receives one profile value.
const profileEmailEl = document.getElementById('profileEmail');
const profileGenderEl = document.getElementById('profileGender');
const profileLocationEl = document.getElementById('profileLocation');
const profileFirstNameEl = document.getElementById('profileFirstName');
const profileLastNameEl = document.getElementById('profileLastName');
const profileDisplayNameEl = document.getElementById('profileDisplayName');
const profilePhoneEl = document.getElementById('profilePhone');
const statusEl = document.getElementById('formStatus');
const profileInfoList = document.getElementById('profileInfoList');
const profileEditForm = document.getElementById('profileEditForm');
const editInfoBtn = document.getElementById('editInfoBtn');

// Input fields used in edit mode.
const editFirstNameEl = document.getElementById('editFirstName');
const editLastNameEl = document.getElementById('editLastName');
const editDisplayNameEl = document.getElementById('editDisplayName');
const useFullNameAsDisplayEl = document.getElementById('useFullNameAsDisplay');
const editEmailEl = document.getElementById('editEmail');
const editGenderEl = document.getElementById('editGender');
const editLocationEl = document.getElementById('editLocation');
const editPhoneEl = document.getElementById('editPhone');

// -----------------------------
// Runtime state (in-memory only)
// -----------------------------
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

// Build full name from first and last values (used for auto display name mode).
function buildFullName(firstName, lastName) {
  return `${firstName} ${lastName}`.trim();
}

// Sync display name input based on checkbox state.
// If checkbox is checked, display name is auto-computed and input is disabled.
// If unchecked, user can type a custom display name.
function syncDisplayNameInput() {
  const first = cleanValue(editFirstNameEl.value);
  const last = cleanValue(editLastNameEl.value);
  const useFullName = useFullNameAsDisplayEl.checked;

  editDisplayNameEl.disabled = useFullName;
  if (useFullName) {
    editDisplayNameEl.value = buildFullName(first, last);
  }
}

// Render all requested fields into the HTML list.
// Name is split into first and last from Firestore fields.
// Params:
// - userDoc: Firestore users/{uid} object (or null)
// - authUser: Firebase Auth user object (or null)
function renderProfile(userDoc, authUser) {
  profileEmailEl.textContent = safeValue(userDoc?.email || authUser?.email);
  profileGenderEl.textContent = safeValue(userDoc?.gender);
  profileLocationEl.textContent = safeValue(userDoc?.location?.municipality);
  profileFirstNameEl.textContent = safeValue(userDoc?.name?.first);
  profileLastNameEl.textContent = safeValue(userDoc?.name?.last);
  profileDisplayNameEl.textContent = safeValue(userDoc?.name?.display || authUser?.displayName);
  profilePhoneEl.textContent = safeValue(userDoc?.phone);
}

// Copy current values into the editable input fields.
// Called when profile data is loaded and right before entering edit mode.
// Params:
// - userDoc: Firestore users/{uid} object (or null)
// - authUser: Firebase Auth user object (or null)
function fillEditForm(userDoc, authUser) {
  const firstName = userDoc?.name?.first || '';
  const lastName = userDoc?.name?.last || '';
  const fullName = buildFullName(firstName, lastName);
  const storedDisplayName = userDoc?.name?.display || authUser?.displayName || fullName;
  const storedToggle = userDoc?.name?.useFullNameAsDisplay;
  const useFullName = typeof storedToggle === 'boolean' ? storedToggle : storedDisplayName === fullName;

  editFirstNameEl.value = firstName;
  editLastNameEl.value = lastName;
  editDisplayNameEl.value = storedDisplayName;
  useFullNameAsDisplayEl.checked = useFullName;

  editEmailEl.value = userDoc?.email || authUser?.email || '';
  editGenderEl.value = userDoc?.gender || '';
  editLocationEl.value = userDoc?.location?.municipality || '';
  editPhoneEl.value = userDoc?.phone || '';

  syncDisplayNameInput();
}

// Switch between read-only and edit mode in one place.
// This updates visibility + button label so UI state stays consistent.
// Param enableEdit:
// - true  => show form + Save info button text
// - false => show list + Edit info button text
function toggleEditMode(enableEdit) {
  isEditMode = enableEdit;
  profileInfoList.style.display = enableEdit ? 'none' : 'block';
  profileEditForm.style.display = enableEdit ? 'block' : 'none';
  editInfoBtn.textContent = enableEdit ? 'Save info' : 'Edit info';
}

// Save all editable fields back to Firestore, then sync auth displayName.
// Param user:
// - current authenticated Firebase user (must contain uid)
// Returns:
// - true  => save succeeded
// - false => validation failed or save failed
async function saveProfileEdits(user) {
  // Read and normalize current input values.
  const firstName = cleanValue(editFirstNameEl.value);
  const lastName = cleanValue(editLastNameEl.value);
  const useFullNameAsDisplay = useFullNameAsDisplayEl.checked;
  const displayName = useFullNameAsDisplay
    ? buildFullName(firstName, lastName)
    : cleanValue(editDisplayNameEl.value);
  const email = cleanValue(editEmailEl.value);
  const gender = cleanValue(editGenderEl.value);
  const municipality = cleanValue(editLocationEl.value);
  const phone = cleanValue(editPhoneEl.value);

  // Basic validation before writing to database.
  if (!firstName || !lastName) {
    setStatus('First name and last name are required.', true);
    return false;
  }

  if (!displayName) {
    setStatus('Display name cannot be empty.', true);
    return false;
  }

  try {
    // Merge into existing users/{uid} document so untouched fields are kept.
    // Persisted fields in this save:
    // - email, gender, phone
    // - name.first, name.last, name.display, name.useFullNameAsDisplay
    // - location.municipality
    // - meta.updatedAt
    await db.collection('users').doc(user.uid).set(
      {
        email,
        gender,
        phone,
        name: {
          first: firstName,
          last: lastName,
          display: displayName,
          useFullNameAsDisplay
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
    await user.updateProfile({ displayName });
    return true;
  } catch (error) {
    setStatus(error.message || 'Could not save profile.', true);
    return false;
  }
}

// Fetch users/{uid} from Firestore and paint the list.
// If the document is missing, renderProfile still runs with null userDoc so fallbacks appear.
// Param user:
// - current authenticated Firebase user
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

// While typing first/last name, keep display name up-to-date
// when auto mode (checkbox) is enabled.
// Keep display name in sync while editing names, if checkbox is enabled.
editFirstNameEl.addEventListener('input', syncDisplayNameInput);
editLastNameEl.addEventListener('input', syncDisplayNameInput);
useFullNameAsDisplayEl.addEventListener('change', syncDisplayNameInput);
