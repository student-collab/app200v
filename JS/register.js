import { registerWithEmail, auth, db } from './modules/dbConfig.js';
import { setUser } from './modules/FS_Requests.js';

const form = document.getElementById('profileEditForm');
const registerBtn = document.getElementById('editInfoBtn');
const statusEl = document.getElementById('formStatus');

const editFirstNameEl = document.getElementById('editFirstName');
const editLastNameEl = document.getElementById('editLastName');
const editDisplayNameEl = document.getElementById('editDisplayName');
const useFullNameAsDisplayEl = document.getElementById('useFullNameAsDisplay');
const editEmailEl = document.getElementById('editEmail');
const editPasswordEl = document.getElementById('editPassword');
const editGenderEl = document.getElementById('editGender');
const editLocationEl = document.getElementById('editLocation');
const editAddressEl = document.getElementById('editAddress');
const editCountryEl = document.getElementById('editCountry');
const editMunicipalityIdEl = document.getElementById('editMunicipalityId');
const editPhoneEl = document.getElementById('editPhone');
const passwordLabelEl = document.querySelector('label[for="editPassword"]');

// Query parameter to tell this page which mode to run in:
// 1) normal registration (email + password creates a new auth user)
// 2) profile completion for an already signed-in Google user
const urlParams = new URLSearchParams(window.location.search);
const isProfileCompletionMode = urlParams.get('completeProfile') === '1';
// Holds the Google-authenticated user while this page is open.
let profileCompletionUser = null;

function setStatus(message, isError = false) {
	statusEl.textContent = message;
	statusEl.style.color = isError ? '#b00020' : '#0b7a3b';
}

// Adapts the form for Google profile completion:
// - email is already provided by Google and should not be edited here
// - password is not needed because account already exists
// - display name can be prefilled from Google profile
function applyGoogleProfileCompletionUi(user) {
	profileCompletionUser = user;

	// Show a simple heading so user knows this is the Google completion step.
	if (!document.getElementById('googleCompletionNotice')) {
		const completionNoticeEl = document.createElement('p');
		completionNoticeEl.id = 'googleCompletionNotice';
		completionNoticeEl.textContent = 'Complete your Google-registration';
		form.prepend(completionNoticeEl);
	}

	// Google already owns this email, so we show it but lock editing.
	editEmailEl.value = user.email || '';
	editEmailEl.readOnly = false;
	editEmailEl.disabled = true;
	editEmailEl.required = false;
	editEmailEl.title = 'Email is locked to your Google account';

	// Extra plain-text hint under the email field.
	if (!document.getElementById('googleEmailLockHint')) {
		const emailLockHintEl = document.createElement('small');
		emailLockHintEl.id = 'googleEmailLockHint';
		emailLockHintEl.textContent = 'Email is taken from your Google account and cannot be edited here.';
		emailLockHintEl.style.display = 'block';
		editEmailEl.insertAdjacentElement('afterend', emailLockHintEl);
	}

	if (editPasswordEl) {
		editPasswordEl.value = '';
		editPasswordEl.disabled = true;
		editPasswordEl.required = false;
		editPasswordEl.style.display = 'none';
	}

	if (passwordLabelEl) {
		passwordLabelEl.style.display = 'none';
	}

	if (!editDisplayNameEl.value && user.displayName) {
		editDisplayNameEl.value = user.displayName;
	}

	setStatus('Google account found. Complete profile and save.');
	syncDisplayNameInput();
}

// Runs only in completeProfile mode.
// It waits for Firebase Auth state, then decides:
// - no signed-in real user -> show error
// - users/{uid} already exists -> skip this page and go to profile
// - users/{uid} missing -> keep user here to complete profile fields
async function setupProfileCompletionMode() {
	if (!isProfileCompletionMode) return;

	auth.onAuthStateChanged(async (user) => {
		if (!user || user.isAnonymous) {
			setStatus('Sign in with Google first.', true);
			return;
		}

		const userDoc = await db.collection('users').doc(user.uid).get();
		if (userDoc.exists) {
			window.location.href = '/pages/userProfile.html';
			return;
		}

		applyGoogleProfileCompletionUi(user);
	});
}

// Normalizes input values before validation or save so empty/null values do not leak into the payload.
function cleanValue(value) {
	return (value || '').trim();
}

// Builds the user's full name from first and last name when the form should auto-generate display name.
function buildFullName(firstName, lastName) {
	return `${firstName} ${lastName}`.trim();
}

// Keeps the Display Name field aligned with the first/last name fields when the checkbox is enabled.
function syncDisplayNameInput() {
	const firstName = cleanValue(editFirstNameEl.value);
	const lastName = cleanValue(editLastNameEl.value);
	const useFullName = useFullNameAsDisplayEl.checked;

	editDisplayNameEl.disabled = useFullName;
	if (useFullName) {
		editDisplayNameEl.value = buildFullName(firstName, lastName);
	}
}

// Builds the Firestore user document that is stored after Firebase Auth creates the account.
function buildProfileData(displayName) {
	return {
		email: cleanValue(editEmailEl.value),
		gender: cleanValue(editGenderEl.value),
		phone: cleanValue(editPhoneEl.value),
		name: {
			first: cleanValue(editFirstNameEl.value),
			last: cleanValue(editLastNameEl.value),
			display: displayName,
			useFullNameAsDisplay: useFullNameAsDisplayEl.checked
		},
		location: {
			address: cleanValue(editAddressEl.value),
			country: cleanValue(editCountryEl.value),
			municipalityId: cleanValue(editMunicipalityIdEl.value),
			municipality: cleanValue(editLocationEl.value)
		},
		meta: {
			createdAt: firebase.firestore.FieldValue.serverTimestamp(),
			updatedAt: firebase.firestore.FieldValue.serverTimestamp()
		}
	};
}

// Validates and saves profile data in users/{uid}.
// In normal mode it first creates Firebase Auth user with email/password.
// In completeProfile mode it reuses the already signed-in Google user.
async function registerUser() {
	syncDisplayNameInput();

	if (!form.checkValidity()) {
		form.reportValidity();
		return;
	}

	const email = cleanValue(editEmailEl.value);
	const password = editPasswordEl.value;
	const firstName = cleanValue(editFirstNameEl.value);
	const lastName = cleanValue(editLastNameEl.value);
	const displayName = useFullNameAsDisplayEl.checked
		? buildFullName(firstName, lastName)
		: cleanValue(editDisplayNameEl.value);

	if (!displayName) {
		setStatus('Display name cannot be empty.', true);
		return;
	}

	registerBtn.disabled = true;
	setStatus('Creating account...');

	try {
		// Two different auth sources depending on mode.
		const user = isProfileCompletionMode
			? (profileCompletionUser || auth.currentUser)
			: await registerWithEmail(email, password);

		// Safety check: we must have a real authenticated user before writing profile.
		if (!user || user.isAnonymous) {
			throw new Error('No authenticated user found for profile completion.');
		}

		// Keep Firebase Auth displayName in sync with our own users/{uid}.name.display.
		await user.updateProfile({ displayName });
		await setUser(user.uid, buildProfileData(displayName));

		// For Google completion flow, go directly to profile after first save.
		if (isProfileCompletionMode) {
			setStatus('Profile saved. Redirecting...');
			window.location.href = '/pages/userProfile.html';
			return;
		}

		setStatus('Account created.');
		window.location.href = '/pages/userProfile.html';
		return;
	} catch (error) {
		setStatus(error.message || 'Could not register account.', true);
	} finally {
		registerBtn.disabled = false;
	}
}

// Re-sync the display name whenever the name fields or checkbox change.
for (const field of [editFirstNameEl, editLastNameEl, useFullNameAsDisplayEl]) {
  field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', syncDisplayNameInput);
}

// Submit the form through the same registration flow and prevent the browser's default reload.
form.addEventListener('submit', (event) => {
	event.preventDefault();
	registerUser();
});

syncDisplayNameInput();
setupProfileCompletionMode();
