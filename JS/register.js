import { registerWithEmail } from './modules/dbConfig.js';
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

function setStatus(message, isError = false) {
	statusEl.textContent = message;
	statusEl.style.color = isError ? '#b00020' : '#0b7a3b';
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

// Validates the form, creates the auth user, then stores the profile data in users/{uid}.
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
		const user = await registerWithEmail(email, password);
		await user.updateProfile({ displayName });
		await setUser(user.uid, buildProfileData(displayName));

		setStatus('Account created.');
		form.reset();
		syncDisplayNameInput();
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
