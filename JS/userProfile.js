import { auth, db } from '../JS/modules/dbConfig.js';
import { getUserTasks, getUsersSavedTasks, getActiveTasks, getAverageRatingForUser } from '../JS/modules/FS_Requests.js';
import { getMarked, renderTasks } from '../JS/modules/renderTasks.js';
import { authGuard } from './authGuard.js';

authGuard();

const userInfo = document.getElementById('userInfo');
const subheaderTitle = document.getElementById('subheaderTitle');
const subheaderIcon = document.getElementById('subheaderIcon');
const sectionWrap = document.getElementById('myProfile');
const sections = sectionWrap.querySelectorAll('.section');
const buttons = sectionWrap.querySelectorAll('.nav-knapper');
const profileSubheader = document.getElementById('profileSubheader');

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *    The element wich contains all the clickable elements                 *
 *    gets an eventlistener. One to caputure them all (event delegation).  *
 *    This listener uses .closest whic propagates from                     *
 *    the clicked element and upwards in the familiy tree,                 *
 *    until it finds an element which has data-selection - a button        *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
sectionWrap.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-section]');
  if (!btn) return;
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
   *    The btn.dataset.section is hardcoded in the HTML and contains      *
   *    the id of the element which the button controls - shows            *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const section = document.getElementById(btn.dataset.section);
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
   *    btn.dataset.title - hardcoded in the HTML, contains the title      *
   *    to display for the content in the element that will be shown       *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  showSection(section, btn.dataset.title);
});

profileSubheader.addEventListener('click', onSubheaderClick);

function showSection(section, title) {
  buttons.forEach((btn) => {
    btn.style.display = 'none';
  });
  userInfo.style.display = 'none';
  section.style.display = 'block';
  setSubheaderAsBackButton(title);
}

function showProfile() {
  sections.forEach((view) => {
    view.style.display = 'none';
  });
  userInfo.style.display = 'block';
  buttons.forEach((btn) => {
    btn.style.display = 'flex';
  });
  subheaderTitle.textContent = 'Brukerprofil';
  subheaderIcon.innerHTML = '&#9881';
  profileSubheader.classList.remove('is-back');
}

function onSubheaderClick() {
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *    Title, subheader is always visble but only acts        *
   *    like a back-button when it has the class 'is-back'     *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  if (profileSubheader.classList.contains('is-back')) {
    showProfile();
  }
}

function setSubheaderAsBackButton(title) {
  subheaderTitle.textContent = title;
  subheaderIcon.textContent = '<-';
  profileSubheader.classList.add('is-back');
}

auth.onAuthStateChanged((user) => {
  const activeUser = user && !user.isAnonymous ? user : null;

  if (!activeUser) {
    clearTaskContainers();
    return;
  }

  initUserData(activeUser);
  initAverageRating(activeUser.uid);
  initUserTaskData(activeUser.uid);
  usersSaved(activeUser.uid);
  usersActiveTasks(activeUser.uid);
  initUserReviews(activeUser.uid);

  const deleteSelected = document.getElementById('final-delete');
  deleteSelected.addEventListener('click', () => {
    const markedForRemoval = getMarked();
    console.log('deleting ' + JSON.stringify([...markedForRemoval]));
  });
});

function initUserData(user) {
  const welcomeElement = document.getElementById('loadUsername');
  const profilePhoto = document.getElementById('profile-photo');
  const placeholderPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0'
    + 'iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iM'
    + 'TIwIiB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+PHBhdGggZD0iTTYwIDBjMzMuMTQ4IDA'
    + 'gNjAgMjYuODUyIDYwIDYwUzE5My4xNDggMTIwIDE2MCAxMjBIMTBjLTMzLjE0OCAwL'
    + 'TYwLTI2Ljg1Mi02MC02MFMxNi44NTIgMCA2MCAweiIgZmlsbD0iI2ZmZiIvPjxjaXJ'
    + 'jbGUgY3g9IjYwIiBjeT0iNTAiIHI9IjE4IiBmaWxsPSIjZGRkZGRkIi8+PGNpcmNsZ'
    + 'SBjeD0iNjAiIGN5PSI4MCIgcj0iMjAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=';

  welcomeElement.textContent = user ? `${user.displayName || 'User'}` : 'Logg inn for aa se din profil';
  profilePhoto.src = user.photoURL ? user.photoURL : placeholderPhoto;
}

function filterData(taskData) {
  const dataSelect = [];
  taskData.forEach((task) => {
    dataSelect.push({
      id: task.id,
      title: task.title,
      pris: task.pris,
      kommune: task.location.kommune,
      kategori: task.category,
      rating: task.rating,
      urgent: task.urgent,
      distance: 0.0,
      images: task.images
    });
  });
  return dataSelect;
}

async function initUserTaskData(userUid) {
  const taskData = await getUserTasks(userUid);
  const dataSelect = filterData(taskData);
  dataSelect.forEach((ds) => {
    ds.own = true;
  });

  const HTMLFrag = renderTasks(dataSelect, true);
  const ownTasksContainer = document.getElementById('own-tasks');
  ownTasksContainer.replaceChildren(HTMLFrag);
  lucide.createIcons();

  document.getElementById('show-erase-buttons').addEventListener('click', (e) => {
    document.querySelectorAll('.deleteTaskBtn').forEach((btn) => {
      btn.classList.toggle('hidden');
    });
    document.getElementById('sikker-sletting').classList.toggle('hidden');
    const sletter = e.target.textContent === 'Slette oppdrag';
    e.target.textContent = sletter ? 'Avbryt' : 'Slette oppdrag';
  });
}

async function usersActiveTasks(userUid) {
  const taskData = await getActiveTasks(userUid);
  taskData.forEach((task) => {
    if (task.createdBy && task.createdBy.uid === userUid) {
      task.isMine = true;
    }
  });

  const dataSelect = filterData(taskData);
  dataSelect.forEach((ds) => {
    const original = taskData.find((t) => t.id === ds.id);
    if (original && original.isMine) ds.isMine = true;
  });

  const HTMLFrag = renderTasks(dataSelect);
  const activeTasksContainer = document.getElementById('active-tasks');
  if (activeTasksContainer) {
    activeTasksContainer.replaceChildren();
    activeTasksContainer.appendChild(HTMLFrag);
    lucide.createIcons();
  }
}

async function usersSaved(userUid) {
  const taskData = await getUsersSavedTasks(userUid);
  const dataSelect = filterData(taskData);
  const HTMLFrag = renderTasks(dataSelect);
  const savedTasksContainer = document.getElementById('saved-tasks');
  savedTasksContainer.replaceChildren(HTMLFrag);
  lucide.createIcons();
}

function clearTaskContainers() {
  document.getElementById('own-tasks')?.replaceChildren();
  document.getElementById('saved-tasks')?.replaceChildren();
  document.getElementById('active-tasks')?.replaceChildren();

  const averageRatingElement = document.getElementById('averageRating');
  if (averageRatingElement) {
    averageRatingElement.textContent = 'Vurdering -';
  }

  const reviewsList = document.getElementById('my-reviews-list');
  if (reviewsList) {
    reviewsList.innerHTML = '<p class="review-info">Logg inn for aa se vurderinger.</p>';
  }
}

async function initAverageRating(userUid) {
  const averageRatingElement = document.getElementById('averageRating');
  if (!averageRatingElement || !userUid) return;

  averageRatingElement.textContent = 'Vurdering -';
  try {
    const averageRating = await getAverageRatingForUser(userUid);
    const ratingText = averageRating == null ? '-' : Number(averageRating).toFixed(1);
    averageRatingElement.textContent = `Vurdering ${ratingText}`;
  } catch (error) {
    console.error('Could not load average rating:', error);
    averageRatingElement.textContent = 'Vurdering -';
  }
}

function formatReviewDate(createdAt) {
  return createdAt?.toDate
    ? createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    : 'Ukjent tidspunkt';
}

function buildStars(rating = 0) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return '\u2605'.repeat(value) + '\u2606'.repeat(5 - value);
}

function createReviewCard(review) {
  const card = document.createElement('article');
  card.className = 'review-card';

  const heading = document.createElement('div');
  heading.className = 'review-card-heading';

  const stars = document.createElement('span');
  stars.className = 'review-stars';
  stars.textContent = buildStars(review.rating);

  const date = document.createElement('span');
  date.className = 'review-date';
  date.textContent = formatReviewDate(review.createdAt);

  const text = document.createElement('p');
  text.className = 'review-text';
  text.textContent = review.text || 'Ingen tekst i vurderingen.';

  heading.append(stars, date);
  card.append(heading, text);
  return card;
}

async function initUserReviews(userUid) {
  const reviewsSection = document.getElementById('myReviews');
  if (!reviewsSection || !userUid) return;

  let reviewsList = document.getElementById('my-reviews-list');
  if (!reviewsList) {
    reviewsList = document.createElement('div');
    reviewsList.id = 'my-reviews-list';
    reviewsList.className = 'review-list';
    reviewsSection.appendChild(reviewsList);
  }

  reviewsList.innerHTML = '<p class="review-info">Laster vurderinger...</p>';

  try {
    const reviewsSnap = await db
      .collection('users')
      .doc(userUid)
      .collection('reviews')
      .where('isVisible', '==', true)
      .get();

    if (reviewsSnap.empty) {
      reviewsList.innerHTML = '<p class="review-info">Ingen synlige vurderinger enda.</p>';
      return;
    }

    const sortedDocs = [...reviewsSnap.docs].sort((a, b) => {
      const aMs = a.data()?.createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
      const bMs = b.data()?.createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
      return bMs - aMs;
    });

    reviewsList.replaceChildren();
    sortedDocs.forEach((doc) => {
      const review = { id: doc.id, ...doc.data() };
      reviewsList.appendChild(createReviewCard(review));
    });
  } catch (error) {
    console.error('Could not load user reviews:', error);
    reviewsList.innerHTML = '<p class="review-info">Kunne ikke hente vurderinger.</p>';
  }
}

const editProfileButton = document.querySelector('.editProfileBtn');
editProfileButton?.addEventListener('click', () => {
  window.location.href = 'editProfile.html';
});