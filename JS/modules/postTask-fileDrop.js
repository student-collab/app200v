
(function () {
  const zone    = document.getElementById('file-drop');
  const input   = document.getElementById('file-drop__input');
  const list    = document.getElementById('file-drop__list');
  const status  = document.getElementById('file-drop__status');

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  let files = [];                     // intern liste

  /* ── Hjelpere ─────────────────────────────────────────────────── */
  function fmtSize(b) {
    return b < 1048576
      ? (b / 1024).toFixed(0) + ' KB'
      : (b / 1048576).toFixed(1) + ' MB';
  }

  function showStatus(msg) {
    status.textContent = msg;
    status.classList.toggle('visible', !!msg);
  }

  function render() {
    list.innerHTML = '';
    list.hidden = files.length === 0;

    files.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'fd-item';
      item.innerHTML =
        `<span class="fd-item__name" title="${f.name}">${f.name}</span>
         <span class="fd-item__size">${fmtSize(f.size)}</span>
         <button class="fd-item__remove" type="button"
                 aria-label="Fjern ${f.name}" data-i="${i}">✕</button>`;
      list.appendChild(item);
    });

    list.querySelectorAll('.fd-item__remove').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        files.splice(+btn.dataset.i, 1);
        render();
        showStatus('');
      })
    );
  }

  function addFiles(incoming) {
    showStatus('');
    let skipped = 0;

    Array.from(incoming).forEach(f => {
      if (!f.type.startsWith('image/')) { skipped++; return; }
      if (f.size > MAX_SIZE)            { skipped++; return; }
      const dup = files.some(x => x.name === f.name && x.size === f.size);
      if (!dup) files.push(f);
    });

    if (skipped)
      showStatus(`${skipped} fil(er) ble ikke lagt til (ikke bilde eller for stor).`);

    render();
  }

  /* ── Eksponert API – bruk i form-submit ───────────────────────── */
  window.getDroppedFiles = () => files;

  /* ── Drag & drop ──────────────────────────────────────────────── */
  const isAdvanced = (() => {
    const d = document.createElement('div');
    return ('draggable' in d || ('ondragstart' in d && 'ondrop' in d))
        && 'FormData' in window
        && 'FileReader' in window;
  })();

  if (isAdvanced) {
    ['dragover','dragenter','dragleave','drop'].forEach(ev =>
      zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); })
    );
    zone.addEventListener('dragover',  () => zone.classList.add('dragover'));
    zone.addEventListener('dragenter', () => zone.classList.add('dragover'));
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      zone.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });
  }

  /* ── Klikk / tastatur ─────────────────────────────────────────── */
  input.addEventListener('change', e => {
    addFiles(e.target.files);
    e.target.value = '';
  });

  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') input.click();
  });

  /* Forhindre at nettleseren åpner filen ved slipp utenfor sonen */
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop',     e => e.preventDefault());
}());