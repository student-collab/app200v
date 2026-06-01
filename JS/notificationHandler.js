import {getUserNotifications, deleteNotification, acceptTaskRequest, denyTaskRequest, getTask} from './modules/FS_Requests.js';
import {auth, db} from './modules/dbConfig.js';

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(createdAt) {
  return createdAt?.toDate
    ? createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    : 'Just now';
}

let container = document.getElementById('notificationsList');
let reviewModal = null;
let reviewState = {
  targetUserId: '',
  taskId: '',
  notificationId: '',
  rating: 0
};

function getReviewModal() {
  if (reviewModal) return reviewModal;

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

  const closeModal = () => {
    wrapper.classList.add('hidden');
    reviewState = { targetUserId: '', taskId: '', notificationId: '', rating: 0 };
    wrapper.querySelector('#reviewText').value = '';
    updateStarUi(0);
  };

  const updateStarUi = (rating) => {
    const stars = wrapper.querySelectorAll('.star-btn');
    stars.forEach((star) => {
      const starRating = Number(star.dataset.rating || 0);
      star.classList.toggle('active', starRating <= rating);
    });
  };

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

async function loadNotifications() {  
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  let notifications = [];
  try {
    notifications = await getUserNotifications(currentUserId);
  } catch (error) {
    console.error('Could not load notifications:', error);
    container.innerHTML = '<div class="notification-card read"><div class="notification-body"><p>Kunne ikke hente varsler (mangler tilgang).</p></div></div>';
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

  // Build a map: taskId -> taskTitle
  const taskTitleMap = {};
  taskResults.forEach(task => {
    if (task && task.id) taskTitleMap[task.id] = task.title || '';
  });
  // Build a map: assigneeId -> displayName
  const assigneeNameMap = {};
  userResults.forEach(user => {
    if (user && user.id) assigneeNameMap[user.id] = user.display;
  });
  const unreadCountElement = document.getElementById('unreadCount');

  if (!Array.isArray(notifications) || notifications.length === 0) {
    if (unreadCountElement) unreadCountElement.textContent = '0 unread';
    container.innerHTML = '<div class="notification-card read"><div class="notification-body"><p>No notifications yet</p></div></div>';
    return;
  }

  const sortedNotifications = [...notifications].sort((a, b) => {
    const aMs = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bMs = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bMs - aMs;
  });

  const unreadCount = sortedNotifications.filter((notification) => !notification.read).length;
  if (unreadCountElement) {
    unreadCountElement.textContent = `${unreadCount} unread`;
  }

  container.innerHTML = sortedNotifications.map((notification) => {
    const title = escapeHtml(notification.title || 'Notification');
    const description = escapeHtml(notification.description || '');
    const timeText = formatTimestamp(notification.createdAt);
    const taskTitle = notification.taskId ? escapeHtml(taskTitleMap[notification.taskId] || '') : '';
    const assigneeName = notification.assigneeId ? escapeHtml(assigneeNameMap[notification.assigneeId] || '') : '';
    const readClass = notification.read ? ' read' : '';
    const unreadDot = notification.read ? '' : '<span class="unread-dot" aria-hidden="true"></span>';
    const requestControls = notification.type === 'request'
      ? `<div class="request-controls">
          <button class="accept-btn" aria-label="Aksepter request">Aksepter</button>
          <button class="reject-btn" aria-label="Avvis request">Avvis</button>
        </div>`
      : '';
    
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
            <button class="delete-btn" aria-label="Delete notification">X</button>
          </div>
          <p class="notification-desc">${description}</p>
          ${requestControls}
          ${reviewControls}
        </div>
        ${unreadDot}
      </div>
    `;
  }).join('');

  // Add event listener for delete buttons
  container.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.delete-btn');
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

    const reviewBtn = event.target.closest('.review-btn');
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

auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadNotifications();
});