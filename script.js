// ═══════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════
const ls = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

// ═══════════════════════════════════════
//  INIT SETTINGS (Brightness, Blur)
// ═══════════════════════════════════════
const savedBright  = ls.get('ss_bright', 50);
const savedBgBlur  = ls.get('ss_bgBlur', 0);
const savedBoxBlur = ls.get('ss_boxBlur', 30);
const savedPomo    = ls.get('ss_pomo', 25);
const savedAmbVol  = ls.get('ss_ambVol', 70);
const savedLofiVol = ls.get('ss_lofiVol', 60);

document.getElementById('brightSlider').value  = savedBright;
document.getElementById('bgBlurSlider').value  = savedBgBlur;
document.getElementById('boxBlurSlider').value = savedBoxBlur;
document.getElementById('pomoSlider').value    = savedPomo;
document.getElementById('ambVolSlider').value  = savedAmbVol;
document.getElementById('lofiVolSlider').value = savedLofiVol;

document.getElementById('brightVal').textContent  = savedBright + '%';
document.getElementById('bgBlurVal').textContent  = savedBgBlur + 'px';
document.getElementById('boxBlurVal').textContent = savedBoxBlur + 'px';
document.getElementById('pomoVal').textContent    = savedPomo + ' min';
document.getElementById('ambVolVal').textContent  = savedAmbVol + '%';
document.getElementById('lofiVolVal').textContent = savedLofiVol + '%';

// Apply initial styles
function applyBrightness(v) {
    // 100% Brightness = 0% Black Overlay. 10% Brightness = 90% Black Overlay
    const alpha = 1 - (v / 100);
    document.documentElement.style.setProperty('--brightness-overlay', `rgba(0,0,0,${alpha})`);
}
function applyBgBlur(v) { document.documentElement.style.setProperty('--bg-blur', `${v}px`); }
function applyBoxBlur(v) { document.documentElement.style.setProperty('--box-blur', `${v}px`); }

applyBrightness(savedBright);
applyBgBlur(savedBgBlur);
applyBoxBlur(savedBoxBlur);

// Event Listeners for Sliders
document.getElementById('brightSlider').oninput = e => {
    const v = +e.target.value; applyBrightness(v);
    document.getElementById('brightVal').textContent = v + '%'; ls.set('ss_bright', v);
};
document.getElementById('bgBlurSlider').oninput = e => {
    const v = +e.target.value; applyBgBlur(v);
    document.getElementById('bgBlurVal').textContent = v + 'px'; ls.set('ss_bgBlur', v);
};
document.getElementById('boxBlurSlider').oninput = e => {
    const v = +e.target.value; applyBoxBlur(v);
    document.getElementById('boxBlurVal').textContent = v + 'px'; ls.set('ss_boxBlur', v);
};
document.getElementById('pomoSlider').oninput = e => {
    const v = +e.target.value;
    document.getElementById('pomoVal').textContent = v + ' min'; ls.set('ss_pomo', v);
    if (!pomoTimer) { pomoTimeLeft = v * 60; pomoTotal = pomoTimeLeft; renderPomo(); }
};

// ═══════════════════════════════════════
//  UI HIDE TOGGLE
// ═══════════════════════════════════════
let uiHidden = false;
function toggleUI() {
    uiHidden = !uiHidden;
    document.body.classList.toggle('ui-hidden', uiHidden);
    if (uiHidden) closeAllPanels();
}

// ═══════════════════════════════════════
//  DATETIME
// ═══════════════════════════════════════
function updateDatetime() {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('badgeTime').textContent = `${h}:${m}`;
    document.getElementById('badgeDate').textContent = `${days[now.getDay()]} ${String(now.getDate()).padStart(2, '0')}`;
}



// ═══════════════════════════════════════
//  MODE SWITCHING
// ═══════════════════════════════════════
let currentMode = 'clock';
function switchMode(mode, index) {
    currentMode = mode;

    document.querySelectorAll('.mode').forEach(m => {
        m.classList.remove('active-mode');
        m.classList.remove('active-view');
    });

    const view = document.getElementById(`${mode}-view`);
    view.classList.add('active-mode');
    view.classList.add('active-view');

    document.querySelectorAll('.mode-btn')
        .forEach((b, i) => b.classList.toggle('active', i === index));
}

// ═══════════════════════════════════════
//  CLOCK
// ═══════════════════════════════════════
function updateClock() {
    const now = new Date();
    document.getElementById('digital-clock').textContent = now.toLocaleTimeString([], { hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

// ═══════════════════════════════════════
//  POMODORO (Fixed Scope Structure)
// ═══════════════════════════════════════
let pomoTimer = null, pomoTimeLeft = null, pomoTotal = null, pomoSession = 0, pomoDone = 0;
const POMO_TOTAL = 4;
const POMO_SESSIONS = [
    { label: 'FOCUS', dur: () => ls.get('ss_pomo', 25) * 60 },
    { label: 'BREAK', dur: () => 5 * 60 },
    { label: 'LONG',  dur: () => 15 * 60 },
];

function renderPomoDots() {
    const c = document.getElementById('pomoSessions'); c.innerHTML = '';
    for (let i = 0; i < POMO_TOTAL; i++) {
        const d = document.createElement('div'); d.className = 'pdot';
        if (i < pomoDone) d.classList.add('done');
        else if (i === pomoDone && pomoTimer) d.classList.add('now');
        c.appendChild(d);
    }
}

function renderPomo() {
    if (pomoTimeLeft === null) { pomoTimeLeft = POMO_SESSIONS[0].dur(); pomoTotal = pomoTimeLeft; }
    const m = Math.floor(pomoTimeLeft / 60), s = pomoTimeLeft % 60;
    document.getElementById('pomo-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    const pct = pomoTotal > 0 ? (pomoTimeLeft / pomoTotal) * 100 : 100;
    document.getElementById('pomoBar').style.width = pct + '%';
    document.getElementById('pomo-timer').classList.toggle('urgent', pomoTimeLeft <= 60 && pomoTimeLeft > 0);
    renderPomoDots();
}
renderPomo();

function startPomo() {
    if (pomoTimer) return;
    if (!pomoTimeLeft) { pomoTimeLeft = POMO_SESSIONS[pomoSession].dur(); pomoTotal = pomoTimeLeft; }
    document.getElementById('pomo-label').textContent = POMO_SESSIONS[pomoSession].label;
    pomoTimer = setInterval(() => {
        pomoTimeLeft--; renderPomo();
        if (pomoTimeLeft <= 0) {
            clearInterval(pomoTimer); pomoTimer = null;
            document.getElementById('alarm').play().catch(() => {});
            if (pomoSession === 0) { pomoDone = Math.min(pomoDone + 1, POMO_TOTAL); }
            if (pomoDone >= POMO_TOTAL) pomoDone = 0;
            pomoSession = (pomoSession + 1) % POMO_SESSIONS.length;
            pomoTimeLeft = POMO_SESSIONS[pomoSession].dur(); pomoTotal = pomoTimeLeft;
            document.getElementById('pomo-label').textContent = POMO_SESSIONS[pomoSession].label;
            renderPomo();
            document.getElementById('pomoToggleBtn').textContent = 'START';
        }
    }, 1000);
}

function stopPomo() { clearInterval(pomoTimer); pomoTimer = null; }

function togglePomo() {
    if (pomoTimer) {
        stopPomo();
        document.getElementById('pomoToggleBtn').textContent = 'START';
    } else {
        startPomo();
        document.getElementById('pomoToggleBtn').textContent = 'STOP';
    }
}

function resetPomo() {
    stopPomo(); pomoSession = 0; pomoDone = 0;
    pomoTimeLeft = POMO_SESSIONS[0].dur(); pomoTotal = pomoTimeLeft;
    document.getElementById('pomo-label').textContent = 'FOCUS';
    document.getElementById('pomo-timer').classList.remove('urgent');
    document.getElementById('pomoToggleBtn').textContent = 'START';
    renderPomo();
}

// ═══════════════════════════════════════
//  FLIP CLOCK TIMER
// ═══════════════════════════════════════
let fH = 0, fM = 0, fS = 0, flipTimer = null;

function renderFlipUnit(id, val) {
    const el = document.getElementById(id);
    const txt = String(val).padStart(2, '0');
    if (el.textContent !== txt) {
        el.textContent = txt;
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
}
function renderFlip() { renderFlipUnit('flip-h', fH); renderFlipUnit('flip-m', fM); renderFlipUnit('flip-s', fS); }

function adjustFlip(u, v) {
    if (flipTimer) return;
    if (u === 'h') fH = Math.max(0, fH + v);
    if (u === 'm') fM = Math.max(0, Math.min(59, fM + v));
    if (u === 's') fS = Math.max(0, Math.min(59, fS + v));
    renderFlip();
}

function startFlip() {
    if (flipTimer || (!fH && !fM && !fS)) return;
    flipTimer = setInterval(() => {
        if (fS > 0) fS--;
        else if (fM > 0) { fM--; fS = 59; }
        else if (fH > 0) { fH--; fM = 59; fS = 59; }
        else { 
            clearInterval(flipTimer); flipTimer = null; 
            document.getElementById('alarm').play().catch(() => {}); 
            document.getElementById('flipToggleBtn').textContent = 'START';
            return; 
        }
        renderFlip();
    }, 1000);
}
function stopFlip() { clearInterval(flipTimer); flipTimer = null; }

function toggleFlip() {
    if (flipTimer) {
        stopFlip();
        document.getElementById('flipToggleBtn').textContent = 'START';
    } else {
        startFlip();
        if(fH || fM || fS) document.getElementById('flipToggleBtn').textContent = 'STOP';
    }
}

function resetFlip() { stopFlip(); fH = 0; fM = 0; fS = 0; renderFlip(); document.getElementById('flipToggleBtn').textContent = 'START';}

// ═══════════════════════════════════════
//  PANEL CONTROLS
// ═══════════════════════════════════════
const PANELS = ['settingsPanel', 'ambientPanel', 'lofiPanel', 'wallpaperPanel'];
function closeAllPanels() {
    PANELS.forEach(id => document.getElementById(id).classList.remove('open'));
    ['settingsBtn', 'ambientBtn', 'lofiBtn', 'wallpaperBtn'].forEach(id => {
        const el = document.getElementById(id); if (el) el.classList.remove('active');
    });
}
function togglePanel(id, e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById(id);
    const wasOpen = panel.classList.contains('open');
    closeAllPanels();
    if (!wasOpen) {
        panel.classList.add('open');
        const btnMap = { settingsPanel: 'settingsBtn', ambientPanel: 'ambientBtn', lofiPanel: 'lofiBtn', wallpaperPanel: 'wallpaperBtn' };
        const btnId = btnMap[id];
        if (btnId) document.getElementById(btnId).classList.add('active');
    }
}
// AFTER
window.addEventListener('click', e => {
    const path = e.composedPath();
    const inPanel = PANELS.some(id => path.includes(document.getElementById(id)));
    const inBtn = ['settingsBtn', 'ambientBtn', 'lofiBtn', 'wallpaperBtn'].some(id => {
        const el = document.getElementById(id); return el && path.includes(el);
    });
    if (!inPanel && !inBtn) closeAllPanels();
});

// ═══════════════════════════════════════
//  AMBIENT
// ═══════════════════════════════════════
const AMBIENT_SOUNDS = [
    { id: 'an1', label: 'Thunderstorm', icon: '⛈️' },
    { id: 'an2', label: 'Forest',      icon: '🌲' },
    { id: 'an3', label: 'Ocean',       icon: '🌊' },
    { id: 'an4', label: 'Fire',        icon: '🔥' },
    { id: 'an5', label: 'Wind',        icon: '💨' },
    { id: 'an6', label: 'Coffeeshop',  icon: '☕' },
    { id: 'an7', label: 'Stream',      icon: '🏞️' },
    { id: 'an8', label: 'Brown Noise', icon: '🟫' },
    { id: 'an9', label: 'Birds',       icon: '🐦' },
];
const ambAudioEls = {};
const ambCont = document.getElementById('ambientAudios');
AMBIENT_SOUNDS.forEach(s => {
    const a = document.createElement('audio');
    a.src = `${s.id}.mp3`; a.loop = true; a.preload = 'none'; a.volume = savedAmbVol / 100;
    ambCont.appendChild(a); ambAudioEls[s.id] = a;
});
const ambGrid = document.getElementById('ambGrid');
AMBIENT_SOUNDS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'amb-btn'; btn.id = 'ambBtn_' + s.id;
    btn.innerHTML = `<span class="amb-icon">${s.icon}</span>${s.label}`;
    btn.onclick = () => {
        const audio = ambAudioEls[s.id];
        if (btn.classList.contains('playing')) { audio.pause(); audio.currentTime = 0; btn.classList.remove('playing'); }
        else { audio.play().catch(() => {}); btn.classList.add('playing'); }
    };
    ambGrid.appendChild(btn);
});
document.getElementById('ambVolSlider').oninput = e => {
    const v = +e.target.value / 100;
    Object.values(ambAudioEls).forEach(a => a.volume = v);
    document.getElementById('ambVolVal').textContent = e.target.value + '%';
    ls.set('ss_ambVol', +e.target.value);
};

// ═══════════════════════════════════════
//  LOFI
// ═══════════════════════════════════════
const LOFI_TRACKS = [
    { name: 'Track 1', sub: 'lofi / chill', src: 'lofi1.mp3' },
    { name: 'Track 2', sub: 'lofi / rain',  src: 'lofi2.mp3' },
    { name: 'Track 3', sub: 'lofi / night', src: 'lofi3.mp3' },
];
let lofiCurrent = 0, lofiPlaying = false;
const lofiAudio = document.getElementById('lofiAudio');
lofiAudio.volume = savedLofiVol / 100;
lofiAudio.src = LOFI_TRACKS[0].src;

const playIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
const pauseIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

function fmtTime(s) { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function lofiLoadTrack(idx) {
    lofiCurrent = idx; const t = LOFI_TRACKS[idx]; lofiAudio.src = t.src;
    document.getElementById('lofiTrackName').textContent = t.name;
    document.getElementById('lofiTrackSub').textContent = t.sub;
    document.getElementById('lofiProgressBar').style.width = '0%';
    document.getElementById('lofiCurrentTime').textContent = '0:00';
    document.getElementById('lofiDuration').textContent = '0:00';
    document.querySelectorAll('.lofi-track-item').forEach((el, i) => el.classList.toggle('playing', i === idx));
}
function lofiToggle() {
    if (lofiPlaying) { lofiAudio.pause(); lofiPlaying = false; document.getElementById('lofiPlayBtn').innerHTML = playIcon; }
    else { lofiAudio.play().catch(() => {}); lofiPlaying = true; document.getElementById('lofiPlayBtn').innerHTML = pauseIcon; }
}
function lofiNext() { lofiLoadTrack((lofiCurrent + 1) % LOFI_TRACKS.length); if (lofiPlaying) lofiAudio.play().catch(() => {}); }
function lofiPrev() { lofiLoadTrack((lofiCurrent - 1 + LOFI_TRACKS.length) % LOFI_TRACKS.length); if (lofiPlaying) lofiAudio.play().catch(() => {}); }

lofiAudio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = lofiAudio;
    if (!isNaN(duration) && duration > 0) {
        document.getElementById('lofiProgressBar').style.width = (currentTime / duration * 100) + '%';
        document.getElementById('lofiCurrentTime').textContent = fmtTime(currentTime);
        document.getElementById('lofiDuration').textContent = fmtTime(duration);
    }
});
lofiAudio.addEventListener('ended', lofiNext);
document.getElementById('lofiProgressWrap').addEventListener('click', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!isNaN(lofiAudio.duration)) lofiAudio.currentTime = ((e.clientX - rect.left) / rect.width) * lofiAudio.duration;
});
document.getElementById('lofiVolSlider').oninput = e => {
    lofiAudio.volume = +e.target.value / 100;
    document.getElementById('lofiVolVal').textContent = e.target.value + '%';
    ls.set('ss_lofiVol', +e.target.value);
};

const trackListEl = document.getElementById('lofiTrackList');
LOFI_TRACKS.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'lofi-track-item' + (i === 0 ? ' playing' : '');
    div.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                     <div><div class="lofi-track-name">${t.name}</div><div class="lofi-track-meta">${t.sub}</div></div>`;
    div.onclick = () => { lofiLoadTrack(i); if (!lofiPlaying) lofiToggle(); else lofiAudio.play().catch(() => {}); };
    trackListEl.appendChild(div);
});

// ═══════════════════════════════════════
let todos = ls.get('ss_todos', []);
function saveTodos() { ls.set('ss_todos', todos); }
function renderTodos() {
    const list = document.getElementById('todoList'); list.innerHTML = '';
    todos.forEach((todo, i) => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (todo.done ? ' done' : '');
        item.innerHTML = `<div class="todo-check"></div><span class="todo-text">${todo.text}</span>`;
        item.onclick = () => { todos[i].done = !todos[i].done; saveTodos(); renderTodos(); };
        list.appendChild(item);
    });
}
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim(); if (!text) return;
    todos.push({ text, done: false }); saveTodos(); renderTodos(); input.value = '';
}
function clearDoneTodos() { todos = todos.filter(t => !t.done); saveTodos(); renderTodos(); }
document.getElementById('todoInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
renderTodos();


// ═══════════════════════════════════════
//  WALLPAPER
// ═══════════════════════════════════════
const WPS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494548162494-384bba4ab999?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=2000&auto=format&fit=crop'
];
const wpGrid = document.getElementById('wallpaperGrid');
const savedWallIdx = ls.get('ss_wall', null);

function setBackground(url) {
    document.body.style.background = `url('${url}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';
}

WPS.forEach((file, i) => {
    const t = document.createElement('div');
    t.className = 'wp-thumb' + (i === savedWallIdx ? ' active' : '');
    t.style.backgroundImage = `url('${file}')`;
    t.onclick = () => {
        setBackground(file);
        ls.set('ss_wall', i); ls.set('ss_wall_url', null);
        document.querySelectorAll('.wp-thumb').forEach((x, j) => x.classList.toggle('active', j === i));
    };
    wpGrid.appendChild(t);
});

const uploadLabel = document.createElement('label');
uploadLabel.className = 'wp-upload'; uploadLabel.htmlFor = 'bgUpload';
uploadLabel.textContent = '+ UPLOAD';
wpGrid.appendChild(uploadLabel);

const savedWallUrl = ls.get('ss_wall_url', null);
if (savedWallUrl) { setBackground(savedWallUrl); }
else if (savedWallIdx !== null && WPS[savedWallIdx]) { setBackground(WPS[savedWallIdx]); }

document.getElementById('bgUpload').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        setBackground(ev.target.result);
        document.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('active'));
        ls.set('ss_wall', null); ls.set('ss_wall_url', ev.target.result);
    };
    reader.readAsDataURL(file);
});

// External Wallpaper Logic
function setExternalWallpaper() {
    const url = document.getElementById('extWallInput').value.trim();
    if (url) {
        setBackground(url);
        document.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('active'));
        ls.set('ss_wall', null);
        ls.set('ss_wall_url', url);
        document.getElementById('extWallInput').value = '';
    }
}

// ═══════════════════════════════════════
//  FULLSCREEN
// ═══════════════════════════════════════
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreenBtn');
    if (!document.fullscreenElement) {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
    } else {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`;
    }
});

// ═══════════════════════════════════════
//  ALARM UNLOCK
// ═══════════════════════════════════════
document.addEventListener('click', () => {
    const a = document.getElementById('alarm');
    a.play().then(() => a.pause()).catch(() => {});
}, { once: true });
