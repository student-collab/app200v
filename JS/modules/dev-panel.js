
import{db } from '/JS/modules/dbConfig.js'


const PAGES = [
  { label: 'DevDashboard', path: '/pages/dev-dashboard.html', isOverview: true },
  { label: 'Landing',        path: '/index.html' },
  // Main pages
  { label: 'oppgaveliste',       path: '/pages/oppgaveliste.html' },
  { label: 'Messages',           path: '/pages/notifications.html' },
  { label: 'Post Task',          path: '/pages/post-task.html' },
  { label: 'postedTaskDetail',   path: '/pages/postedTaskDetail.html' },
  { label: 'User Profile',       path: '/pages/userProfile.html' },

  // Prosjektfiler
  { label: 'dev-dashboard',      path: '/pages/dev-dashboard.html' },
  { label: 'editProfile',        path: '/pages/editProfile.html' },
  { label: 'messages',           path: '/pages/messages.html' },
  { label: 'messagesChat',       path: '/pages/messagesChat.html' },
  { label: 'notifications',      path: '/pages/notifications.html' },
  { label: 'oppgaveliste',       path: '/pages/oppgaveliste.html' },
  { label: 'post-task',          path: '/pages/post-task.html' },
  { label: 'postedTaskDetail',   path: '/pages/postedTaskDetail.html' },
  { label: 'register',           path: '/pages/register.html' },
  { label: 'userProfile',        path: '/pages/userProfile.html' },
  { label: 'navbar',             path: '/pages/html-fragments/navbar.html' }
];

export function initDevPanel(container) {
  const currentPath = window.location.pathname;
  const pageKey = 'notes-' + currentPath.replace(/\\/g, '/').split('/').pop();

  container.style.cssText = `
    position: absolute;
    top: 16px;
    left: 16px;
    width: 220px;
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    background: #1a1a2e;
    color: #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    user-select: none;
  `;

  container.innerHTML = buildHTML(currentPath);
  attachBehavior(container, db, pageKey);
}

function buildHTML(currentPath) {
  const navLinks = PAGES.map(p => {
    const isActive = p.path === currentPath;
    const style = p.deprecated
      ? 'color:#4a4a6a;text-decoration:line-through'
      : p.isOverview ? 'color:#ffcc44;font-weight:500' : 'color:#88aaff';
    return `<a href="${p.path}" style="${style}${isActive ? ';background:#1e2a50' : ''}">${p.label}</a>`;
  }).join('');

  return `
    <div id="devpanel-header" style="background:#16213e;padding:6px 10px;display:flex;align-items:center;gap:8px;cursor:default;border-bottom:1px solid #0f3460;border-radius:8px 8px 0 0">
      <div style="display:grid;grid-template-columns:repeat(3,4px);gap:2px">
        ${'<span style="width:3px;height:3px;background:#4a4a6a;border-radius:50%;display:block"></span>'.repeat(6)}
      </div>
      <span style="font-size:9px;color:#7a7aaa;letter-spacing:.08em;text-transform:uppercase;flex:1">DEV PANEL</span>
      <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#7a7aaa;cursor:pointer">
        <input type="checkbox" id="devpanel-drag-cb" style="display:none">
        <span id="devpanel-drag-slider" class="devpanel-toggle"></span>
        drag
      </label>
    </div>
    <div style="padding:8px">
      <div style="font-size:9px;color:#4a4a6a;text-transform:uppercase;letter-spacing:.1em;margin:4px 0">Navigate</div>
      <div id="devpanel-nav" style="display:flex;flex-direction:column;gap:1px">
        ${navLinks}
      </div>
      <hr style="border:none;border-top:1px solid #1e1e3a;margin:8px 0">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px">
        <span style="font-size:10px;color:#7a7aaa">Show notes</span>
        <label style="cursor:pointer">
          <input type="checkbox" id="devpanel-notes-cb" style="display:none">
          <span id="devpanel-notes-slider" class="devpanel-toggle"></span>
        </label>
      </div>
      <div id="devpanel-notes" style="display:none;margin:6px 4px 2px;background:#0f1020;border:1px solid #2a2a5a;border-radius:4px;padding:6px;font-size:10px;color:#aaccff;line-height:1.5">
        <span id="devpanel-notes-text">Loading…</span>
        <a id="devpanel-notes-link" href="/pages/dev-dashboard.html#note-${location.pathname.replace(/\W/g,'_')}"
           style="display:block;margin-top:4px;font-size:9px;color:#ffcc44;text-decoration:none">
          ✎ Edit note in overview ↗
        </a>
      </div>
    </div>
  `;
}

function attachBehavior(container, db, pageKey) {
  injectToggleCSS();

  // --- notes toggle ---
  const notesCb = container.querySelector('#devpanel-notes-cb');
  const notesBox = container.querySelector('#devpanel-notes');
  const notesText = container.querySelector('#devpanel-notes-text');
  const notesSlider = container.querySelector('#devpanel-notes-slider');
  let notesFetched = false;

  notesCb.addEventListener('change', async () => {
    notesSlider.classList.toggle('on', notesCb.checked);
    notesBox.style.display = notesCb.checked ? 'block' : 'none';
    if (notesCb.checked && !notesFetched) {
      notesFetched = true;
      try {
        const snap = await db.collection('devNotes').doc(pageKey).get();
        if (snap.exists) {
          notesText.textContent = snap.data().note ?? '(no note for this page yet)';
          if (snap.data().note === '') notesText.textContent = '(no note for this page yet)';
        } else {
          notesText.textContent = '(no note for this page yet)';
        }
      } catch (e) {
        notesText.textContent = 'Could not load note.' + e;
      }
    }
  });

  // --- nav link styles ---
  container.querySelectorAll('#devpanel-nav a').forEach(a => {
    a.style.cssText += ';display:block;padding:3px 6px;text-decoration:none;border-radius:3px';
    a.addEventListener('mouseenter', () => { if (!a.dataset.deprecated) a.style.background = '#1e2a50'; });
    a.addEventListener('mouseleave', () => { a.style.background = 'transparent'; });
  });

  // --- drag toggle ---
  const dragCb = container.querySelector('#devpanel-drag-cb');
  const dragSlider = container.querySelector('#devpanel-drag-slider');
  const header = container.querySelector('#devpanel-header');
  let dragEnabled = false, dragging = false, ox = 0, oy = 0;

  dragCb.addEventListener('change', () => {
    dragEnabled = dragCb.checked;
    dragSlider.classList.toggle('on', dragEnabled);
    header.style.cursor = dragEnabled ? 'grab' : 'default';
  });

  header.addEventListener('mousedown', e => {
    if (!dragEnabled) return;
    dragging = true;
    ox = e.clientX - container.offsetLeft;
    oy = e.clientY - container.offsetTop;
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    container.style.left = (e.clientX - ox) + 'px';
    container.style.top  = (e.clientY - oy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    header.style.cursor = dragEnabled ? 'grab' : 'default';
  });
}

function injectToggleCSS() {
  if (document.getElementById('devpanel-toggle-css')) return;
  const s = document.createElement('style');
  s.id = 'devpanel-toggle-css';
  s.textContent = `
    .devpanel-toggle {
      display: inline-block; width: 26px; height: 14px;
      background: #2a2a4a; border-radius: 7px; position: relative;
      transition: background .2s;
    }
    .devpanel-toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 10px; height: 10px; background: #fff; border-radius: 50%;
      transition: left .2s;
    }
    .devpanel-toggle.on { background: #4CAF50; }
    .devpanel-toggle.on::after { left: 14px; }
  `;
  document.head.appendChild(s);
}