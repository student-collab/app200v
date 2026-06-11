//notificationhandler.js håndterer hele varslingssystemet i applikasjonen. 
// Filen henter varsler fra Firestore, viser dem i brukergrensesnittet, lar brukeren akseptere eller avslå forespørsler, skrive anmeldelser etter fullførte oppdrag, og vise profiler med tidligere vurderinger. 
// Den benytter Firebase Authentication for å identifisere brukeren og Firestore for lagring og henting av data.


//Importerer funksjoner for håndtering av varsler, oppgaver og vurderinger, samt Firebase-konfigurasjon og sjekker om brukeren er autentisert før siden laster.
import {getUserNotifications, deleteNotification, acceptTaskRequest, denyTaskRequest, getTask, getAverageRatingForUser} from './modules/FS_Requests.js';
import {auth, db} from './modules/dbConfig.js';
import { authGuard } from './authGuard.js';

authGuard();

// Hindrer HTML-injeksjon/XSS ved å erstatte spesialtegn
function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Konverterer Firebase-tidsstempel til lesbart datoformateller viser "Just now" hvis tidsstempel mangler eller er ugyldig.
function formatTimestamp(createdAt) {
  return createdAt?.toDate
    ? createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    : 'Just now';
}

//Referanse til området der varsler skal vises
let container = document.getElementById('notificationsList');
//Variabler som brukes til å håndtere visning og tilstand for vurderingsmodalen. 
//reviewModal holder referansen til modal-elementet, mens reviewState sporer hvilken bruker og oppgave som vurderes, samt den valgte stjernerangeringen.
let reviewModal = null;
let reviewState = {
  targetUserId: '',
  taskId: '',
  notificationId: '',
  rating: 0
};

//Oppretter og returnerer modalvinduet som brukes til å gi vurderinger.
function getReviewModal() {
  //Hvis modalen allerede finnes, returneres den.
  if (reviewModal) return reviewModal;

  //Oppretter modalens HTML-struktur dynamisk
  const wrapper = document.createElement('div');
  wrapper.className = 'review-modal-overlay hidden';
  wrapper.innerHTML = `
    <div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="reviewTitle">
      <button class="review-close-btn" type="button" aria-label="Lukk">✕</button>
      <h2 id="reviewTitle">Gi vurdering</h2>
      <p class="review-modal-subtitle">Hvordan var opplevelsen?</p>
      <textarea class="review-textarea" id="reviewText" rows="4" maxlength="1000" placeholder="Skriv vurderingen din her..."></textarea>
      <div class="review-stars" aria-label="Velg stjerner">
        <button type="button" class="star-btn" data-rating="1" aria-label="1 stjerne">★</button>
        <button type="button" class="star-btn" data-rating="2" aria-label="2 stjerner">★</button>
        <button type="button" class="star-btn" data-rating="3" aria-label="3 stjerner">★</button>
        <button type="button" class="star-btn" data-rating="4" aria-label="4 stjerner">★</button>
        <button type="button" class="star-btn" data-rating="5" aria-label="5 stjerner">★</button>
      </div>
      <div class="review-modal-actions">
        <button type="button" class="review-cancel-btn">Avbryt</button>
        <button type="button" class="review-submit-btn">Send vurdering</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  //funksjon for å lukke modalvinduet og tilbakestille tilstanden
  const closeModal = () => {
    wrapper.classList.add('hidden');
    reviewState = { targetUserId: '', taskId: '', notificationId: '', rating: 0 };
    wrapper.querySelector('#reviewText').value = '';
    updateStarUi(0);
  };

  //oppdaterer visning av stjerner basert på valgt vurdering
  const updateStarUi = (rating) => {
    const stars = wrapper.querySelectorAll('.star-btn');
    stars.forEach((star) => {
      const starRating = Number(star.dataset.rating || 0);
      star.classList.toggle('active', starRating <= rating);
    });
  };

  //håndterer alle klikk inne i modalvinduet, inkludert lukking, stjernevalg og innsending av vurdering
  wrapper.addEventListener('click', async (event) => {
    if (event.target === wrapper) {
      closeModal();
      return;
    }

    const closeBtn = event.target.closest('.review-close-btn, .review-cancel-btn');
    if (closeBtn) {
      closeModal();
      return;
    }

    const starBtn = event.target.closest('.star-btn');
    if (starBtn) {
      const rating = Number(starBtn.dataset.rating || 0);
      reviewState.rating = rating;
      updateStarUi(rating);
      return;
    }

    const submitBtn = event.target.closest('.review-submit-btn');
    if (!submitBtn) return;

    const reviewText = wrapper.querySelector('#reviewText').value.trim();
    if (!reviewState.targetUserId || !reviewState.rating) {
      alert('Velg stjerner før du sender.');
      return;
    }

    submitBtn.disabled = true;
    try {
      const reviewerId = auth.currentUser?.uid || null;
      const taskId = reviewState.taskId || null;

      const newReviewRef = await db.collection('users').doc(reviewState.targetUserId).collection('reviews').add({
        text: reviewText,
        rating: reviewState.rating,
        taskId,
        reviewedUserId: reviewState.targetUserId,
        reviewerId,
        isVisible: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        revealedAt: null
      });

      // Reviews stay hidden until both parties have submitted for the same task.
      if (reviewerId && taskId) {
        const counterpartSnap = await db
          .collection('users')
          .doc(reviewerId)
          .collection('reviews')
          .where('taskId', '==', taskId)
          .where('reviewedUserId', '==', reviewerId)
          .where('reviewerId', '==', reviewState.targetUserId)
          .limit(1)
          .get();

        if (!counterpartSnap.empty) {
          const batch = db.batch();
          const now = firebase.firestore.FieldValue.serverTimestamp();

          batch.update(newReviewRef, {
            isVisible: true,
            revealedAt: now
          });

          batch.update(counterpartSnap.docs[0].ref, {
            isVisible: true,
            revealedAt: now
          });

          await batch.commit();
        }
      }

      if (reviewState.notificationId && auth.currentUser?.uid) {
        await deleteNotification(reviewState.notificationId, auth.currentUser.uid);
        const card = container.querySelector(`[data-id="${reviewState.notificationId}"]`);
        if (card) {
          const desc = card.querySelector('.notification-desc');
          if (desc) desc.textContent = 'Takk! Vurderingen er sendt.';
          const controls = card.querySelector('.review-controls');
          if (controls) controls.remove();
        }
      }

      closeModal();
    } catch (error) {
      console.error('Could not submit review:', error);
      alert('Kunne ikke sende vurdering. Proev igjen.');
    } finally {
      submitBtn.disabled = false;
    }
  });

  //Returnerer funksjon som åpner modalen med nødvendig kontekst (hvilken bruker og oppgave som vurderes)
  reviewModal = {
    wrapper,
    open: ({ targetUserId, taskId, notificationId }) => {
      reviewState = {
        targetUserId: targetUserId || '',
        taskId: taskId || '',
        notificationId: notificationId || '',
        rating: 0
      };
      wrapper.querySelector('#reviewText').value = '';
      updateStarUi(0);
      wrapper.classList.remove('hidden');
    }
  };

  return reviewModal;
}

//Lager en tekstbasert stjernerangering basert på numerisk vurdering (0-5). For eksempel, en vurdering på 3 vil returnere "★★★☆☆".
function buildStarRating(rating = 0) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

//Oppretter modalvindu for visning av brukerprofil og anmeldelser
function getProfileModal() {
  //Returnerer eksisterende modal hvis den allerede finnes for å unngå duplisering
  if (window.profileModal) return window.profileModal;

  const wrapper = document.createElement('div');
  wrapper.className = 'review-modal-overlay hidden';
  wrapper.innerHTML = `
    <div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
      <button class="review-close-btn" type="button" aria-label="Lukk">✕</button>
      <div class="profile-modal-header">
        <div class="profile-photo-container">
          <img id="profilePhotoModal" class="profile-photo-modal" alt="Profilbilde" src="" />
        </div>
        <div class="profile-header-text">
          <h2 id="profileTitle">Profil</h2>
          <p class="review-modal-subtitle">Se kandidatens gjennomsnittlige vurdering og tidligere anmeldelser.</p>
        </div>
      </div>
      <div class="profile-summary">
        <div class="profile-summary-row">
          <span class="profile-label">Navn</span>
          <span class="profile-value" id="profileName">Laster...</span>
        </div>
        <div class="profile-summary-row">
          <span class="profile-label">Gjennomsnitt</span>
          <span class="profile-value" id="profileAverageRating">-</span>
        </div>
      </div>
      <div class="review-list" id="profileReviewsList">
        <p class="review-info">Laster vurderinger...</p>
      </div>
      <div class="review-modal-actions">
        <button type="button" class="review-cancel-btn">Lukk</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  //Lukker profilmodal og nullstiller innholdet
  const closeModal = () => {
    wrapper.classList.add('hidden');
    const nameEl = wrapper.querySelector('#profileName');
    const averageEl = wrapper.querySelector('#profileAverageRating');
    const reviewsList = wrapper.querySelector('#profileReviewsList');
    if (nameEl) nameEl.textContent = 'Laster...';
    if (averageEl) averageEl.textContent = '-';
    if (reviewsList) reviewsList.innerHTML = '<p class="review-info">Laster vurderinger...</p>';
  };

  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) {
      closeModal();
      return;
    }

    const closeBtn = event.target.closest('.review-close-btn, .review-cancel-btn');
    if (closeBtn) {
      closeModal();
      return;
    }
  });

  //åpner profilmodalen og laster brukerdata fra firestore for å vise navn, profilbilde, 
  // gjennomsnittlig vurdering og individuelle anmeldelser. Håndterer også feil ved innlastning av data.
  window.profileModal = {
    wrapper,
    open: async ({ userId, displayName }) => {
      wrapper.classList.remove('hidden');
      const profileNameEl = wrapper.querySelector('#profileName');
      const averageRatingEl = wrapper.querySelector('#profileAverageRating');
      const reviewsList = wrapper.querySelector('#profileReviewsList');

      if (profileNameEl) profileNameEl.textContent = 'Laster...';
      if (averageRatingEl) averageRatingEl.textContent = '-';
      if (reviewsList) reviewsList.innerHTML = '<p class="review-info">Laster vurderinger...</p>';

      try {
        let profileName = displayName || 'Bruker';
        let userData = null;
        const userSnap = await db.collection('users').doc(userId).get();
        if (userSnap.exists) {
          userData = userSnap.data();
          profileName = userData?.name?.display || userData?.user?.name?.display || userData?.displayName || profileName;
        }

        if (profileNameEl) profileNameEl.textContent = profileName;

        const profilePhotoEl = wrapper.querySelector('#profilePhotoModal');
        const userPhotoUrl = userData?.photoURL || userData?.profilePhoto || userData?.photo || '';
        if (profilePhotoEl) {
          profilePhotoEl.src = userPhotoUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="28" fill="%23e8ede9"/><circle cx="60" cy="44" r="24" fill="%23c8d1c6"/><path d="M24 104c0-22 18-40 40-40s40 18 40 40" fill="%23c8d1c6"/></svg>';
        }

        const averageRating = await getAverageRatingForUser(userId);
        if (averageRatingEl) averageRatingEl.textContent = averageRating == null ? '-' : Number(averageRating).toFixed(1);

        const reviewsSnap = await db.collection('users').doc(userId).collection('reviews').where('isVisible', '==', true).get();
        if (!reviewsSnap.empty) {
          reviewsList.innerHTML = '';
          const sortedDocs = [...reviewsSnap.docs].sort((a, b) => {
            const aMs = a.data()?.createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
            const bMs = b.data()?.createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
            return bMs - aMs;
          });

          sortedDocs.forEach((doc) => {
            const review = doc.data();
            const reviewCard = document.createElement('article');
            reviewCard.className = 'profile-review-card';
            reviewCard.innerHTML = `
              <div class="review-card-heading">
                <span class="review-stars">${buildStarRating(review.rating)}</span>
                <span class="review-date">${formatTimestamp(review.createdAt)}</span>
              </div>
              <p class="review-text">${escapeHtml(review.text || 'Ingen tekst i vurderingen.')}</p>
            `;
            reviewsList.appendChild(reviewCard);
          });
        } else {
          reviewsList.innerHTML = '<p class="review-info">Ingen synlige vurderinger enda.</p>';
        }
      } catch (error) {
        console.error('Could not load profile details:', error);
        if (reviewsList) reviewsList.innerHTML = '<p class="review-info">Kunne ikke hente profil.</p>';
      }
    }
  };

  return window.profileModal;
}

//henter og viser alle varsler for den innloggede brukeren
async function loadNotifications() {  
  //henter brukerid til innlogget bruker.
  const currentUserId = auth.currentUser?.uid;

  //henter varsler fra databasen
  let notifications = [];
  try {
    notifications = await getUserNotifications(currentUserId);
  } catch (error) {
    console.error('Could not load notifications:', error);
    container.innerHTML = '<div class="notification-card read"><div class="notification-body"><p>Kunne ikke hente varsler (mangler tilgang).</p></div></div>';
    return;
  }

  // Allow getUserNotifications to return a string message (legacy behaviour).
  // If a string is returned, render it and exit early instead of calling .map().
  if (typeof notifications === 'string') {
    const unreadCountElement = document.getElementById('unreadCount');
    if (unreadCountElement) unreadCountElement.textContent = '0 uleste';
    container.innerHTML = `<div class="notification-card read"><div class="notification-body"><p>${escapeHtml(notifications)}</p></div></div>`;
    return;
  }

  // Gather all unique taskIds and assigneeIds from notifications
  const taskIds = [...new Set(notifications.map(n => n.taskId).filter(Boolean))];
  const assigneeIds = [...new Set(notifications.map(n => n.assigneeId).filter(Boolean))];

  // Fetch all tasks in parallel and tolerate permission-denied for individual docs.
  const taskResults = await Promise.all(taskIds.map(async (id) => {
    try {
      return await getTask(id);
    } catch {
      return null;
    }
  }));
  // Fetch all user display names in parallel
  const userResults = await Promise.all(assigneeIds.map(async (id) => {
    if (!id) return { id, display: '' };
    try {
      const userDoc = await db.collection('users').doc(id).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const display = userData?.user?.name?.display || userData?.name?.display || '';
      return { id, display };
    } catch {
      return { id, display: '' };
    }
  }));

  // lager oppslagstabell for oppgavetitler: taskId -> taskTitle
  const taskTitleMap = {};
  taskResults.forEach(task => {
    if (task && task.id) taskTitleMap[task.id] = task.title || '';
  });
  // lager oppslagstabell for brukernavn: assigneeId -> displayName
  const assigneeNameMap = {};
  userResults.forEach(user => {
    if (user && user.id) assigneeNameMap[user.id] = user.display;
  });
  const unreadCountElement = document.getElementById('unreadCount');

  if (!Array.isArray(notifications) || notifications.length === 0) {
    if (unreadCountElement) unreadCountElement.textContent = '0 uleste';
    container.innerHTML = '<div class="notification-card read"><div class="notification-body"><p>Ingen varslinger ennå</p></div></div>';
    return;
  }

  //sorterer varslene etter opprettelsestidspunkt, med de nyeste først
  const sortedNotifications = [...notifications].sort((a, b) => {
    const aMs = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bMs = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bMs - aMs;
  });

  //teller antall uleste varsler og oppdaterer visningen av dette
  const unreadCount = sortedNotifications.filter((notification) => !notification.read).length;
  if (unreadCountElement) {
    unreadCountElement.textContent = `${unreadCount} uleste`;
  }

  //genererer HTML for hvert varselkort
  container.innerHTML = sortedNotifications.map((notification) => {
    const title = escapeHtml(notification.title || 'Varsel');
    const description = escapeHtml(notification.description || '');
    const timeText = formatTimestamp(notification.createdAt);
    const taskTitle = notification.taskId ? escapeHtml(taskTitleMap[notification.taskId] || '') : '';
    const assigneeName = notification.assigneeId ? escapeHtml(assigneeNameMap[notification.assigneeId] || '') : '';
    const readClass = notification.read ? ' read' : '';
    const unreadDot = notification.read ? '' : '<span class="unread-dot" aria-hidden="true"></span>';

    //Lager kontrollknapper for request-type varsler (aksepter, avvis, se profil)
    const requestControls = notification.type === 'request'
      ? `<div class="request-controls">
          <button class="accept-btn" aria-label="Aksepter request">Aksepter</button>
          <button class="reject-btn" aria-label="Avvis request">Avvis</button>
          <button class="profile-btn" aria-label="Se profil">Se profil</button>
        </div>`
      : '';
    
    
      //Lager kontrollknapper for review-type varsler (gi vurdering) 
      const reviewControls = notification.type === 'review'
      ? `<div class="review-controls">
          <button class="review-btn" aria-label="Gi vurdering">Gi vurdering</button>
        </div>`
      : '';

    return `
      <div class="notification-card${readClass}" data-id="${notification.id}" data-task-id="${notification.taskId || ''}" data-assignee-id="${notification.assigneeId || ''}">
        <div class="icon-wrapper" aria-hidden="true">🔔</div>
        <div class="notification-body">
          <div class="card-header">
            <h3>${title}${taskTitle ? ` <span class='task-title'>(${taskTitle})</span>` : ''}</h3>
            ${assigneeName ? `<div class='assignee-name'>Fra: ${assigneeName}</div>` : ''}
            <span class="time">${timeText}</span>
            <button class="delete-btn" aria-label="Slett varsel">X</button>
          </div>
          <p class="notification-desc">${description}</p>
          ${requestControls}
          ${reviewControls}
        </div>
        ${unreadDot}
      </div>
    `;
  }).join('');

  // Håndterer alle klikk inne i varslingscontaineren
  container.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.delete-btn');
    //Hvis slett-knappen er klikket, finner vi det tilhørende varselkortet og sletter det både fra databasen og UI.
    if (deleteBtn) {
      const notificationCard = deleteBtn.closest('.notification-card');
      const notificationId = notificationCard?.dataset.id;
      if (!notificationId) return;

      try {
        await deleteNotification(notificationId, currentUserId);
        notificationCard.remove();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
      return;
    }

    const acceptBtn = event.target.closest('.accept-btn');
    // Hvis aksepter-knappen er klikket, henter vi nødvendig informasjon fra data-attributter, 
    // utfører aksepteringslogikken og oppdaterer UI for å reflektere at forespørselen er akseptert.
    if (acceptBtn) {
      const notificationCard = acceptBtn.closest('.notification-card');
      const notificationId = notificationCard?.dataset.id;
      const taskId = notificationCard?.dataset.taskId;
      const assigneeId = notificationCard?.dataset.assigneeId;
      if (!notificationId || !taskId || !assigneeId) {
        console.error('Missing taskId or assigneeId for accept action');
        return;
      }

      try {
        await acceptTaskRequest(taskId, assigneeId, currentUserId);
        await deleteNotification(notificationId, currentUserId);
        const desc = notificationCard.querySelector('.notification-desc');
        if (desc) desc.textContent = 'Forespørselen er akseptert.';
        notificationCard.classList.add('accepted');
        setTimeout(() => notificationCard.remove(), 1200);
      } catch (error) {
        console.error('Failed to accept request:', error);
      }
      return;
    }

    const rejectBtn = event.target.closest('.reject-btn');
    //Avviser forespørselen om oppdrag på samme måte som aksepter, men med annen tekst og styling.
    if (rejectBtn) {
      const notificationCard = rejectBtn.closest('.notification-card');
      const notificationId = notificationCard?.dataset.id;
      const taskId = notificationCard?.dataset.taskId;
      const assigneeId = notificationCard?.dataset.assigneeId;
      if (!notificationId || !taskId || !assigneeId) {
        console.error('Missing taskId or assigneeId for reject action');
        return;
      }

      try {
        await denyTaskRequest(taskId, assigneeId, currentUserId);
        await deleteNotification(notificationId, currentUserId);
        const desc = notificationCard.querySelector('.notification-desc');
        if (desc) desc.textContent = 'Tilbudet er avvist.';
        notificationCard.classList.add('rejected');
        setTimeout(() => notificationCard.remove(), 1200);
      } catch (error) {
        console.error('Failed to reject request:', error);
      }
      return;
    }

    const profileBtn = event.target.closest('.profile-btn');
    //Åpner profilmodalen for brukeren som sendte forspørselen, 
    // ved å hente nødvendig informasjon fra data-attributter og sende det til modalens åpne-funksjon.
    if (profileBtn) {
      const notificationCard = profileBtn.closest('.notification-card');
      const assigneeId = notificationCard?.dataset.assigneeId;
      const assigneeName = notificationCard?.querySelector('.assignee-name')?.textContent?.replace(/^Fra:\s*/,'') || '';
      if (!assigneeId) {
        console.error('Missing assigneeId for profile action');
        return;
      }

      const modal = getProfileModal();
      modal.open({ userId: assigneeId, displayName: assigneeName });
      return;
    }

    const reviewBtn = event.target.closest('.review-btn');
    //Åpner vurderingsmodalen for å gi vurdering til brukeren som var involvert i oppgaven, 
    // ved å hente nødvendig informasjon fra data-attributter og sende det til modalens åpne-funksjon.
    if (reviewBtn) {
      const notificationCard = reviewBtn.closest('.notification-card');
      const notificationId = notificationCard?.dataset.id;
      const taskId = notificationCard?.dataset.taskId;
      const assigneeId = notificationCard?.dataset.assigneeId;
      if (!notificationId || !assigneeId) {
        console.error('Missing notificationId or assigneeId for review action');
        return;
      }

      const modal = getReviewModal();
      modal.open({
        targetUserId: assigneeId,
        taskId,
        notificationId
      });
      return;
    }
});

}

//Når brukeren logger inn, lastes varsler automatisk ved å kalle loadNotifications-funksjonen. 
// Hvis ingen bruker er logget inn, vil funksjonen ikke gjøre noe.
auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadNotifications();
});
