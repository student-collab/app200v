import {getUserNotifications, deleteNotification, acceptTaskRequest, denyTaskRequest} from './modules/FS_Requests.js';
import {auth} from './modules/dbConfig.js';

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

async function loadNotifications() {  
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  const notifications = await getUserNotifications(currentUserId);
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
    const readClass = notification.read ? ' read' : '';
    const unreadDot = notification.read ? '' : '<span class="unread-dot" aria-hidden="true"></span>';
    const requestControls = notification.type === 'request'
      ? `<div class="request-controls">
          <button class="accept-btn" aria-label="Aksepter request">Aksepter</button>
          <button class="reject-btn" aria-label="Avvis request">Avvis</button>
        </div>`
      : '';

    return `
      <div class="notification-card${readClass}" data-id="${notification.id}" data-task-id="${notification.taskId || ''}" data-assignee-id="${notification.assigneeId || ''}">
        <div class="icon-wrapper" aria-hidden="true">🔔</div>
        <div class="notification-body">
          <div class="card-header">
            <h3>${title}</h3>
            <span class="time">${timeText}</span>
            <button class="delete-btn" aria-label="Delete notification">X</button>
          </div>
          <p class="notification-desc">${description}</p>
          ${requestControls}
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
});

}

auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadNotifications();
});