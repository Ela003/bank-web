const MATCH_DATE = '2026-10-25';
const STORAGE_KEY = 'vettai-match-data-v1';
const SESSION_KEY = 'vettai-match-session-v1';
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂', roles: ['ORGANISER', 'INSTITUTE'] },
  { id: 'institutes', label: 'Institutes', icon: '▦', roles: ['ORGANISER'] },
  { id: 'participants', label: 'Participants', icon: '◉', roles: ['ORGANISER', 'INSTITUTE'] },
  { id: 'referees', label: 'Referees', icon: '✳', roles: ['ORGANISER', 'INSTITUTE'] },
  { id: 'pitches', label: 'Pitches', icon: '⌁', roles: ['ORGANISER'] },
  { id: 'downloads', label: 'Downloads', icon: '⇩', roles: ['ORGANISER'] }
];

const seed = {
  registrationOpen: true,
  institutes: [
    { id: 'INS001', loginId: 'INS001', masterName: 'R. Kumar', academyName: 'Veera Silambam Academy', phone: '9876543210', createdAt: '2026-08-18' },
    { id: 'INS002', loginId: 'INS002', masterName: 'Meena Raj', academyName: 'Maruthu Warriors', phone: '9840012345', createdAt: '2026-08-22' },
    { id: 'INS003', loginId: 'INS003', masterName: 'S. Muthu', academyName: 'Thendral Martial Arts', phone: '9789012345', createdAt: '2026-09-02' },
    { id: 'INS004', loginId: 'INS004', masterName: 'K. Selvam', academyName: 'Aathichudi Silambam', phone: '9894012345', createdAt: '2026-09-06' }
  ],
  students: [
    { id: 'STU0001', instituteId: 'INS001', name: 'Arun Kumar', dob: '2014-06-10', category: 'INDIVIDUAL', status: 'VERIFIED', createdAt: '2026-09-12' },
    { id: 'STU0002', instituteId: 'INS001', name: 'Bala Murugan', dob: '2013-03-22', category: 'FIGHT', status: 'PENDING', createdAt: '2026-09-19' },
    { id: 'STU0003', instituteId: 'INS001', name: 'Nila Devi', dob: '2012-11-04', category: 'INDIVIDUAL', status: 'VERIFIED', createdAt: '2026-09-23' },
    { id: 'STU0004', instituteId: 'INS001', name: 'Kavin Raj', dob: '2016-08-14', category: 'FIGHT', status: 'PENDING', createdAt: '2026-09-25' },
    { id: 'STU0005', instituteId: 'INS002', name: 'Aadhi Prakash', dob: '2013-09-12', category: 'INDIVIDUAL', status: 'VERIFIED', createdAt: '2026-09-12' },
    { id: 'STU0006', instituteId: 'INS002', name: 'Kaviya S', dob: '2015-01-03', category: 'FIGHT', status: 'PENDING', createdAt: '2026-09-21' },
    { id: 'STU0007', instituteId: 'INS003', name: 'Vetri Selvan', dob: '2011-12-18', category: 'FIGHT', status: 'VERIFIED', createdAt: '2026-09-16' },
    { id: 'STU0008', instituteId: 'INS004', name: 'Yazhini M', dob: '2017-02-27', category: 'INDIVIDUAL', status: 'PENDING', createdAt: '2026-09-27' }
  ],
  studentSequence: 9,
  referees: [
    { id: 'REF0001', instituteId: 'INS001', name: 'S. Prabhu', age: 34, academyName: 'Veera Silambam Academy', phone: '9880011223' },
    { id: 'REF0002', instituteId: 'INS001', name: 'J. Kala', age: 29, academyName: 'Veera Silambam Academy', phone: '9880011224' },
    { id: 'REF0003', instituteId: 'INS002', name: 'P. Anand', age: 41, academyName: 'Maruthu Warriors', phone: '9840098765' },
    { id: 'REF0004', instituteId: 'INS003', name: 'V. Mani', age: 37, academyName: 'Thendral Martial Arts', phone: '9789054321' }
  ],
  ageGroups: [
    { label: 'Under 10', min: 0, max: 10 },
    { label: 'Under 12', min: 11, max: 12 },
    { label: 'Under 14', min: 13, max: 14 },
    { label: 'Under 16', min: 15, max: 16 },
    { label: 'Open', min: 17, max: 99 }
  ],
  pitches: []
};

let data = loadData();
let session = loadSession();
let activePage = 'dashboard';
let selectedInstitute = null;
let searchText = '';
let statusFilter = 'ALL';
let categoryFilter = 'ALL';
let instituteFilter = 'ALL';
let ageGroupFilter = 'ALL';
let modalState = null;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.institutes) && Array.isArray(saved.students)) {
      const merged = { ...structuredClone(seed), ...saved };
      const highestId = merged.students.reduce((max, student) => Math.max(max, Number(String(student.id).replace('STU', '')) || 0), 0);
      merged.studentSequence = Math.max(Number(merged.studentSequence) || 1, highestId + 1);
      return merged;
    }
  } catch (error) { console.warn('Stored demo records could not be read.', error); }
  return structuredClone(seed);
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function persistSession() { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function esc(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function instituteById(id) { return data.institutes.find(item => item.id === id); }
function currentInstitute() { return session?.role === 'INSTITUTE' ? instituteById(session.instituteId) : null; }
function isOrganiser() { return session?.role === 'ORGANISER'; }
function ageAtMatch(dob) {
  const birth = new Date(`${dob}T00:00:00`);
  const event = new Date(`${MATCH_DATE}T00:00:00`);
  if (!dob || Number.isNaN(birth.getTime()) || birth > event) return null;
  let age = event.getFullYear() - birth.getFullYear();
  if (event.getMonth() < birth.getMonth() || (event.getMonth() === birth.getMonth() && event.getDate() < birth.getDate())) age--;
  return age;
}
function ageGroup(age) { return data.ageGroups.find(group => age >= Number(group.min) && age <= Number(group.max)); }
function instituteStudents(id) { return data.students.filter(student => student.instituteId === id); }
function instituteReferees(id) { return data.referees.filter(referee => referee.instituteId === id); }
function nextId(collection, prefix, length = 4) {
  const largest = collection.reduce((max, record) => Math.max(max, Number(String(record.id).replace(prefix, '')) || 0), 0);
  return `${prefix}${String(largest + 1).padStart(length, '0')}`;
}
function nextStudentCode() { return `STU${String(data.studentSequence).padStart(4, '0')}`; }
function dateLabel(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
function allStats(students = data.students) {
  return {
    total: students.length,
    individual: students.filter(student => student.category === 'INDIVIDUAL').length,
    fight: students.filter(student => student.category === 'FIGHT').length,
    verified: students.filter(student => student.status === 'VERIFIED').length,
    pending: students.filter(student => student.status === 'PENDING').length
  };
}
function toast(message, error = false) {
  const node = document.createElement('div');
  node.className = `toast${error ? ' error' : ''}`;
  node.textContent = message;
  document.querySelector('#toast-root').append(node);
  setTimeout(() => node.remove(), 3100);
}

function render() {
  const root = document.querySelector('#app');
  if (!session) { root.innerHTML = renderLogin(); return; }
  if (session.role === 'INSTITUTE' && !currentInstitute()) { logout(); return; }
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(session.role));
  if (!visibleNav.some(item => item.id === activePage)) activePage = 'dashboard';
  const title = activePage === 'institute-detail' ? 'Institute profile' : NAV_ITEMS.find(item => item.id === activePage)?.label || 'Dashboard';
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        ${brand()}
        <div class="side-event"><span>District tournament</span><strong>Silambam Match</strong><small>25 October 2026 · Tamil Nadu</small></div>
        <div class="nav-label">Workspace</div>
        <nav class="side-nav">${visibleNav.map(item => navButton(item, activePage)).join('')}</nav>
        <div class="side-bottom">
          ${isOrganiser() ? `<div class="registration-chip"><i class="live-dot"></i> Registration ${data.registrationOpen ? 'open' : 'closed'}</div>` : ''}
          ${profileRow()}
        </div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <div class="breadcrumb-wrap"><button class="mobile-menu" data-action="mobile-menu" aria-label="Open navigation">☰</button><div class="breadcrumb">Vettai <span aria-hidden="true">/</span> <strong>${esc(title)}</strong></div></div>
          <div class="top-actions"><span class="event-date">25 OCT 2026</span><span class="role-tag">${session.role}</span></div>
        </header>
        <main class="content">${renderPage()}</main>
      </section>
      <nav class="mobile-nav">${visibleNav.map(item => navButton(item, activePage)).join('')}</nav>
    </div>`;
  renderModal();
}

function brand() { return `<div class="brand"><span class="brand-mark" aria-hidden="true">⌁</span><span>VETTAI</span></div>`; }
function navButton(item, current) { return `<button class="nav-button ${current === item.id ? 'active' : ''}" data-page="${item.id}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`; }
function profileRow() {
  const institute = currentInstitute();
  const name = isOrganiser() ? 'Tournament office' : institute.academyName;
  const role = isOrganiser() ? 'Organiser account' : institute.id;
  const initials = isOrganiser() ? 'TO' : institute.academyName.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return `<div class="profile-row"><div class="avatar">${esc(initials)}</div><div class="profile-meta"><strong>${esc(name)}</strong><small>${esc(role)}</small></div><button class="logout-icon" data-action="logout" title="Log out" aria-label="Log out">↗</button></div>`;
}

function renderLogin() {
  return `<div class="login-shell">
    <section class="login-art">${brand()}<div class="art-copy"><p class="eyebrow">One district. One arena.</p><h1>Discipline meets the day.</h1><p>Registration, verification and pitch coordination for the district Silambam match.</p><div class="event-stamp">25 OCTOBER 2026</div></div><div class="art-foot">DISTRICT SILAMBAM MATCH · 2026</div></section>
    <section class="login-main"><div class="login-panel"><p class="eyebrow">Match administration</p><h2>Welcome back</h2><p>Sign in to your tournament workspace.</p>
      <form id="login-form"><div class="field"><label for="login-id">Login ID</label><input id="login-id" name="loginId" autocomplete="username" placeholder="Your organiser or institute ID" required></div><div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></div><button class="btn btn-primary btn-wide" type="submit">Sign in <span aria-hidden="true">→</span></button></form>
      <div class="demo-block"><p class="demo-label">Explore the local prototype</p><div class="demo-actions"><button class="btn btn-outline" data-action="demo-login" data-role="ORGANISER">Open organiser view</button><button class="btn btn-outline" data-action="demo-login" data-role="INSTITUTE">Open institute view</button></div><p class="demo-note">Demo access skips credential checks. Use the institute preview to manage INS001, or sign in with another institute ID after creating one.</p></div>
      <div class="login-warning"><strong>Prototype only:</strong> records are stored in this browser. Production login, password hashing and data isolation need a secure backend.</div>
    </div></section>
  </div>`;
}

function renderPage() {
  if (activePage === 'dashboard') return renderDashboard();
  if (activePage === 'institutes') return renderInstitutes();
  if (activePage === 'institute-detail') return renderInstituteDetail();
  if (activePage === 'participants') return renderParticipants();
  if (activePage === 'referees') return renderReferees();
  if (activePage === 'pitches') return renderPitches();
  if (activePage === 'downloads') return renderDownloads();
  return renderDashboard();
}

function pageHeading(kicker, title, description, actions = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}
function statCard(label, value, foot, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
}
function renderDashboard() {
  if (isOrganiser()) return renderOrganiserDashboard();
  const institute = currentInstitute();
  const students = instituteStudents(institute.id);
  const stats = allStats(students);
  return `${pageHeading('Institute workspace', 'Academy overview', 'Your registrations at a glance.')}
    <div class="banner"><div class="banner-copy"><span class="banner-symbol">✳</span><div><strong>${esc(institute.academyName)}</strong><small>${esc(institute.masterName)} · ${esc(institute.phone)}</small></div></div><span class="role-tag">${institute.id}</span></div>
    <section class="stat-grid">${statCard('Total participants', stats.total, 'Registered from your academy', '◉')}${statCard('Individual', stats.individual, 'Individual category', '◎')}${statCard('Fight', stats.fight, 'Fight category', '✳')}${statCard('Referees', instituteReferees(institute.id).length, 'Academy referees', '⌖')}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Recent participants</h2><button class="btn btn-quiet" data-page="participants">View all →</button></div><div class="panel-body">${activityList(students.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4))}</div></section><section class="panel"><div class="panel-head"><h2>Quick actions</h2><small>Manage your entries</small></div><div class="panel-body"><div class="quick-links"><button class="quick-link" data-action="add-student" ${!data.registrationOpen ? 'disabled title="Registration is closed"' : ''}><span><strong>Add a participant</strong><small>Register for the October match</small></span><span class="quick-arrow">＋</span></button><button class="quick-link" data-page="referees"><span><strong>Manage referees</strong><small>${instituteReferees(institute.id).length} referees on your roster</small></span><span class="quick-arrow">→</span></button></div>${!data.registrationOpen ? `<p class="note" style="margin:12px 0 0">Registration is closed. New registrations and edits are unavailable.</p>` : ''}</div></section></div>`;
}
function renderOrganiserDashboard() {
  const stats = allStats();
  const verified = stats.verified;
  const pending = data.students.filter(student => student.status === 'PENDING').length;
  const categorySummary = ['INDIVIDUAL', 'FIGHT'].map(category => {
    const count = data.students.filter(student => student.category === category).length;
    return `<div class="activity-item"><span class="activity-mark">${category === 'FIGHT' ? '✳' : '◎'}</span><span><strong>${category}</strong><small>${count} participants registered</small></span><span class="activity-time">${stats.total ? Math.round(count / stats.total * 100) : 0}%</span></div>`;
  }).join('');
  const recent = data.students.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return `${pageHeading('Event control', 'District Silambam Match', 'A clear view of registrations and tournament readiness.', `<button class="btn ${data.registrationOpen ? 'btn-outline' : 'btn-primary'}" data-action="toggle-registration">${data.registrationOpen ? 'Close registration' : 'Reopen registration'}</button>`)}
    <div class="banner"><div class="banner-copy"><span class="banner-symbol">${data.registrationOpen ? '◉' : 'Ⅱ'}</span><div><strong>Registration ${data.registrationOpen ? 'is open' : 'is closed'}</strong><small>${data.registrationOpen ? 'Institutes can add and update participant records.' : 'Institute changes are paused. Organiser access remains active.'}</small></div></div><span class="role-tag">25 OCT 2026</span></div>
    <section class="stat-grid">${statCard('Institutes', data.institutes.length, 'Academies in the district', '▦')}${statCard('Participants', stats.total, `${verified} verified · ${pending} pending`, '◉')}${statCard('Individual', stats.individual, 'Registered entries', '◎')}${statCard('Referees', data.referees.length, 'Across all registered academies', '⌖')}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Latest registrations</h2><button class="btn btn-quiet" data-page="participants">Review participants →</button></div><div class="panel-body">${activityList(recent, true)}</div></section><section class="panel"><div class="panel-head"><h2>Category mix</h2><small>${stats.total} total</small></div><div class="panel-body"><div class="activity-list">${categorySummary}</div><div class="quick-links" style="margin-top:13px"><button class="quick-link" data-page="pitches"><span><strong>Pitch readiness</strong><small>${verified} verified participants eligible</small></span><span class="quick-arrow">→</span></button><button class="quick-link" data-page="institutes"><span><strong>Institute directory</strong><small>${data.institutes.length} academy accounts</small></span><span class="quick-arrow">→</span></button></div></div></section></div>`;
}
function activityList(students, showAcademy = false) {
  if (!students.length) return emptyState('No participants yet', 'New registrations will appear here.');
  return `<div class="activity-list">${students.map(student => {
    const academy = instituteById(student.instituteId)?.academyName || 'Institute';
    return `<div class="activity-item"><span class="activity-mark">${student.category === 'FIGHT' ? '✳' : '◎'}</span><span><strong>${esc(student.name)} <span class="code">${student.id}</span></strong><small>${showAcademy ? `${esc(academy)} · ` : ''}${esc(student.category)} · age ${ageAtMatch(student.dob) ?? '—'} <span class="status status-${student.status.toLowerCase()}">${student.status}</span></small></span><span class="activity-time">${dateLabel(student.createdAt)}</span></div>`;
  }).join('')}</div>`;
}
function emptyState(title, message) { return `<div class="empty-state"><div class="empty-icon">⌁</div><strong>${title}</strong><p>${message}</p></div>`; }

function renderInstitutes() {
  const rows = data.institutes.map(institute => {
    const students = instituteStudents(institute.id);
    const stats = allStats(students);
    return `<tr><td><span class="code">${esc(institute.id)}</span></td><td><span class="cell-primary">${esc(institute.academyName)}</span><span class="cell-sub">${esc(institute.loginId)}</span></td><td>${esc(institute.masterName)}</td><td>${esc(institute.phone)}</td><td>${stats.total}</td><td>${stats.individual}</td><td>${stats.fight}</td><td>${instituteReferees(institute.id).length}</td><td><span class="status status-confirmed">ACTIVE</span></td><td><button class="btn btn-quiet" data-action="view-institute" data-id="${esc(institute.id)}">View →</button></td></tr>`;
  }).join('');
  return `${pageHeading('Directory', 'Institutes', 'Manage academy accounts and review their registrations.', '<button class="btn btn-primary" data-action="add-institute">＋ Create institute</button>')}
    <div class="summary-row"><div class="mini-stat"><span>Institutes</span><strong>${data.institutes.length}</strong></div><div class="mini-stat"><span>Participants</span><strong>${data.students.length}</strong></div><div class="mini-stat"><span>Referees</span><strong>${data.referees.length}</strong></div></div>
    <section class="panel"><div class="table-wrap"><table><thead><tr><th>Institute ID</th><th>Academy</th><th>Master</th><th>Phone</th><th>Students</th><th>Individual</th><th>Fight</th><th>Referees</th><th>Status</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="10">${emptyState('No institutes yet', 'Create an institute account to get started.')}</td></tr>`}</tbody></table></div></section>`;
}

function renderInstituteDetail() {
  const institute = instituteById(selectedInstitute);
  if (!institute) { activePage = 'institutes'; return renderInstitutes(); }
  const students = instituteStudents(institute.id);
  const referees = instituteReferees(institute.id);
  const studentRows = students.map(student => studentRow(student, true)).join('');
  const refereeRows = referees.map(referee => `<tr><td class="cell-primary">${esc(referee.name)}</td><td>${referee.age}</td><td>${esc(referee.academyName)}</td><td>${esc(referee.phone)}</td></tr>`).join('');
  const stats = allStats(students);
  return `${pageHeading('Institute profile', esc(institute.academyName), `${institute.id} · Added ${dateLabel(institute.createdAt)}`, '<button class="btn btn-outline" data-page="institutes">← Back to institutes</button>')}
    <section class="detail-banner"><div><h2>${esc(institute.academyName)}</h2><p>Institute account · ${esc(institute.loginId)}</p><div class="detail-meta"><span>Master<strong>${esc(institute.masterName)}</strong></span><span>Phone<strong>${esc(institute.phone)}</strong></span><span>Participants<strong>${stats.total}</strong></span></div></div><button class="btn btn-outline" data-action="export-institute" data-id="${esc(institute.id)}">⇩ Download data</button></section>
    <div class="summary-row"><div class="mini-stat"><span>All participants</span><strong>${stats.total}</strong></div><div class="mini-stat"><span>Individual</span><strong>${stats.individual}</strong></div><div class="mini-stat"><span>Fight</span><strong>${stats.fight}</strong></div></div>
    <section class="panel" style="margin-bottom:15px"><div class="panel-head"><h2>Participants</h2><small>${stats.verified} verified</small></div><div class="table-wrap"><table><thead>${studentTableHead(true)}</thead><tbody>${studentRows || `<tr><td colspan="7">${emptyState('No participants', 'This institute has not registered students yet.')}</td></tr>`}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>Referees</h2><small>${referees.length} listed</small></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Age</th><th>Academy</th><th>Phone</th></tr></thead><tbody>${refereeRows || `<tr><td colspan="4">${emptyState('No referees', 'No referees have been added by this institute.')}</td></tr>`}</tbody></table></div></section>`;
}

function renderParticipants() {
  const institute = currentInstitute();
  const organiser = isOrganiser();
  const students = organiser ? data.students : instituteStudents(institute.id);
  const needle = searchText.toLowerCase().trim();
  const visible = students.filter(student => {
    const owner = instituteById(student.instituteId);
    const matchesText = !needle || [student.id, student.name, owner?.academyName, owner?.masterName].some(value => value?.toLowerCase().includes(needle));
    const matchesInstitute = !organiser || instituteFilter === 'ALL' || student.instituteId === instituteFilter;
    const matchesAgeGroup = ageGroupFilter === 'ALL' || ageGroup(ageAtMatch(student.dob))?.label === ageGroupFilter;
    return matchesText && matchesInstitute && matchesAgeGroup && (statusFilter === 'ALL' || student.status === statusFilter) && (categoryFilter === 'ALL' || student.category === categoryFilter);
  });
  const addButton = !organiser ? `<button class="btn btn-primary" data-action="add-student" ${!data.registrationOpen ? 'disabled title="Registration is closed"' : ''}>＋ Add student</button>` : '';
  const description = organiser ? 'Review every student entry and verify records before pitch allocation.' : 'Manage your academy’s participant registrations.';
  return `${pageHeading(organiser ? 'Event roster' : 'Academy roster', 'Participants', description, addButton)}
    ${organiser ? `<div class="summary-row"><div class="mini-stat"><span>All entries</span><strong>${students.length}</strong></div><div class="mini-stat"><span>Pending review</span><strong>${students.filter(s => s.status === 'PENDING').length}</strong></div><div class="mini-stat"><span>Verified for pitches</span><strong>${students.filter(s => s.status === 'VERIFIED').length}</strong></div></div>` : (!data.registrationOpen ? `<div class="note" style="margin-bottom:15px">Registration is closed. You can view existing entries, but cannot add, edit or delete participants.</div>` : '')}
    <div class="toolbar"><input type="search" id="participant-search" value="${esc(searchText)}" placeholder="Search ID, student, academy" aria-label="Search participants"><select id="status-filter" aria-label="Filter by status"><option value="ALL">All statuses</option>${['PENDING','VERIFIED','REJECTED','CONFIRMED'].map(value => `<option value="${value}" ${statusFilter === value ? 'selected' : ''}>${value}</option>`).join('')}</select><select id="category-filter" aria-label="Filter by category"><option value="ALL">All categories</option><option value="INDIVIDUAL" ${categoryFilter === 'INDIVIDUAL' ? 'selected' : ''}>Individual</option><option value="FIGHT" ${categoryFilter === 'FIGHT' ? 'selected' : ''}>Fight</option></select><select id="age-group-filter" aria-label="Filter by age group"><option value="ALL">All ages</option>${data.ageGroups.map(group => `<option value="${esc(group.label)}" ${ageGroupFilter === group.label ? 'selected' : ''}>${esc(group.label)}</option>`).join('')}</select>${organiser ? `<select id="institute-filter" aria-label="Filter by institute"><option value="ALL">All institutes</option>${data.institutes.map(item => `<option value="${esc(item.id)}" ${instituteFilter === item.id ? 'selected' : ''}>${esc(item.academyName)}</option>`).join('')}</select>` : ''}<span class="result-count">${visible.length} of ${students.length} participants</span></div>
    <section class="panel"><div class="table-wrap"><table><thead>${studentTableHead(organiser)}</thead><tbody id="participants-body">${visible.length ? visible.map(student => studentRow(student, organiser)).join('') : `<tr><td colspan="${organiser ? 8 : 7}">${emptyState('No matching participants', 'Try another search or adjust the filters.')}</td></tr>`}</tbody></table></div></section>`;
}
function studentTableHead(organiser) { return `<tr><th>Student ID</th><th>Student</th><th>Age</th><th>Category</th>${organiser ? '<th>Institute</th>' : ''}<th>Status</th>${organiser ? '<th>Registered</th>' : ''}<th>Actions</th></tr>`; }
function studentRow(student, organiser) {
  const owner = instituteById(student.instituteId);
  const age = ageAtMatch(student.dob);
  const locked = !organiser && !data.registrationOpen;
  const action = organiser
    ? `<button class="btn btn-quiet" data-action="edit-student" data-id="${student.id}">View</button>${student.status === 'PENDING' ? `<button class="btn btn-quiet" data-action="set-student-status" data-status="VERIFIED" data-id="${student.id}">Verify</button><button class="btn btn-quiet" data-action="set-student-status" data-status="REJECTED" data-id="${student.id}">Reject</button>` : student.status === 'VERIFIED' ? `<button class="btn btn-quiet" data-action="set-student-status" data-status="CONFIRMED" data-id="${student.id}">Confirm</button>` : `<button class="btn btn-quiet" data-action="set-student-status" data-status="${student.status === 'REJECTED' ? 'PENDING' : 'VERIFIED'}" data-id="${student.id}">Reopen</button>`}`
    : `<button class="btn btn-quiet" data-action="edit-student" data-id="${student.id}" ${locked ? 'disabled' : ''}>Edit</button><button class="btn btn-quiet" data-action="delete-student" data-id="${student.id}" ${locked ? 'disabled' : ''}>Delete</button>`;
  return `<tr><td><span class="code">${student.id}</span></td><td><span class="cell-primary">${esc(student.name)}</span><span class="cell-sub">DOB ${dateLabel(student.dob)}</span></td><td>${age ?? '—'}</td><td>${student.category === 'FIGHT' ? 'Fight' : 'Individual'}</td>${organiser ? `<td>${esc(owner?.academyName || '—')}<span class="cell-sub">${esc(owner?.masterName || '')}</span></td>` : ''}<td><span class="status status-${student.status.toLowerCase()}">${student.status}</span></td>${organiser ? `<td>${dateLabel(student.createdAt)}</td>` : ''}<td class="actions-cell">${action}</td></tr>`;
}

function renderReferees() {
  const organiser = isOrganiser();
  const institute = currentInstitute();
  const list = organiser ? data.referees : instituteReferees(institute.id);
  const body = list.map(referee => `<tr><td class="cell-primary">${esc(referee.name)}</td><td>${referee.age}</td>${organiser ? `<td>${esc(instituteById(referee.instituteId)?.academyName || '—')}</td>` : ''}<td>${esc(referee.academyName)}</td><td>${esc(referee.phone)}</td><td class="actions-cell">${organiser ? `<button class="btn btn-quiet" data-action="view-referee" data-id="${referee.id}">View</button>` : `<button class="btn btn-quiet" data-action="edit-referee" data-id="${referee.id}" ${!data.registrationOpen ? 'disabled' : ''}>Edit</button><button class="btn btn-quiet" data-action="delete-referee" data-id="${referee.id}" ${!data.registrationOpen ? 'disabled' : ''}>Delete</button>`}</td></tr>`).join('');
  const addButton = !organiser ? `<button class="btn btn-primary" data-action="add-referee" ${!data.registrationOpen ? 'disabled' : ''}>＋ Add referee</button>` : '';
  return `${pageHeading(organiser ? 'Event officials' : 'Academy officials', 'Referees', organiser ? 'Referee roster across all registered institutes.' : 'Manage referees representing your academy.', addButton)}
    ${organiser ? `<div class="summary-row"><div class="mini-stat"><span>Total referees</span><strong>${list.length}</strong></div><div class="mini-stat"><span>Institutes represented</span><strong>${new Set(list.map(person => person.instituteId)).size}</strong></div><div class="mini-stat"><span>Match date</span><strong>25 Oct</strong></div></div>` : (!data.registrationOpen ? `<div class="note" style="margin-bottom:15px">Registration is closed. Referee records can no longer be changed by institutes.</div>` : '')}
    <section class="panel"><div class="panel-head"><h2>Referee directory</h2><small>${list.length} records</small></div><div class="table-wrap"><table><thead><tr><th>Referee name</th><th>Age</th>${organiser ? '<th>Institute</th>' : ''}<th>Academy</th><th>Phone</th><th>Actions</th></tr></thead><tbody>${body || `<tr><td colspan="6">${emptyState('No referees listed', 'Add a referee to your academy roster.')}</td></tr>`}</tbody></table></div></section>`;
}

function renderPitches() {
  const verified = data.students.filter(student => student.status === 'VERIFIED');
  const cards = data.pitches.map(pitch => `<article class="pitch-card"><div class="pitch-card-head"><div><span class="pitch-number">PITCH ${String(pitch.number).padStart(2, '0')}</span><h3>${esc(pitch.category)} · ${esc(pitch.ageGroup)}</h3></div><small>${pitch.students.length} participants</small></div><div class="table-wrap"><table class="pitch-table"><thead><tr><th>No.</th><th>Student ID</th><th>Name</th><th>Academy</th></tr></thead><tbody>${pitch.students.map((studentId, index) => { const student = data.students.find(item => item.id === studentId); return student ? `<tr><td>${String(index + 1).padStart(2, '0')}</td><td class="code">${student.id}</td><td>${esc(student.name)}</td><td>${esc(instituteById(student.instituteId)?.academyName || '—')}</td></tr>` : ''; }).join('')}</tbody></table></div></article>`).join('');
  return `${pageHeading('Competition setup', 'Pitches', 'Build pitch rosters from verified participants by category and event age.', `<button class="btn btn-primary" data-action="generate-pitches">↻ Generate pitches</button>`)}
    <div class="banner"><div class="banner-copy"><span class="banner-symbol">⌁</span><div><strong>${verified.length} verified participants eligible</strong><small>Participants are grouped by age on 25 October 2026. Only VERIFIED records are included.</small></div></div><span class="role-tag">${data.pitches.length} PITCHES</span></div>
    <div class="split-layout"><div>${data.pitches.length ? `<div class="pitch-list">${cards}</div>` : `<section class="panel">${emptyState('No pitches generated', 'Verify participants, then generate the pitch roster.')}</section>`}</div><aside class="side-panel"><h3>Age groups</h3><p>Set the inclusive upper age for each band. Each band begins after the previous one.</p><form id="age-groups-form">${data.ageGroups.map((group, index) => `<div class="age-row"><span>${esc(group.label)} <small class="muted">from ${group.min}+</small></span><input type="number" name="max-${index}" min="${group.min}" max="99" value="${group.max}" aria-label="Maximum age for ${esc(group.label)}"></div>`).join('')}<button class="btn btn-outline btn-wide" type="submit">Save age bands</button></form><p class="note" style="margin:12px 0 0">“Open” includes all ages from its starting age onward. Empty groups will not create a pitch.</p></aside></div>`;
}

function renderDownloads() {
  const cards = [
    ['students', 'All participants', 'Student roster with age, category, institute and verification status.', 'CSV'],
    ['institutes', 'Institute directory', 'Academy, master, contact and registration totals.', 'CSV'],
    ['referees', 'Referee list', 'Referee names and institute contact details.', 'CSV'],
    ['individual', 'Individual entries', 'All individual category registrations.', 'CSV'],
    ['fight', 'Fight entries', 'All fight category registrations.', 'CSV'],
    ['pitches', 'Pitch rosters', 'Generated pitch number and participant assignments.', 'CSV'],
    ['complete', 'Complete event report', 'Institutes, participants, referees and generated pitch entries in one file.', 'CSV']
  ];
  return `${pageHeading('Data export', 'Downloads', 'Export tournament records for review, sharing and event-day printing.')}
    <div class="note" style="margin-bottom:16px">CSV files open in Excel and other spreadsheet apps. Use the pitch page’s Print command to print or save pitch lists as PDF.</div>
    <div class="download-grid">${cards.map(([type, title, desc, format]) => `<article class="download-card"><span class="download-icon">⇩</span><strong>${title}</strong><small>${desc}</small><button class="btn btn-outline" data-action="download" data-type="${type}">Download ${format}</button></article>`).join('')}</div>
    <section class="panel" style="margin-top:15px"><div class="panel-head"><h2>Print pitch lists</h2><small>${data.pitches.length} pitch rosters</small></div><div class="panel-body" style="display:flex;align-items:center;justify-content:space-between;gap:14px"><span class="muted" style="font-size:11px">Generate pitches first, then print the tournament roster or save it as PDF from your browser’s print dialog.</span><button class="btn btn-primary" data-action="print-pitches" ${!data.pitches.length ? 'disabled' : ''}>Print / Save PDF</button></div></section>`;
}

function renderModal() {
  const root = document.querySelector('#modal-root');
  if (!modalState) { root.innerHTML = ''; return; }
  const { type, id } = modalState;
  if (type === 'student') root.innerHTML = studentModal(id);
  else if (type === 'student-confirm') root.innerHTML = studentConfirmModal(modalState.values);
  else if (type === 'institute') root.innerHTML = instituteModal();
  else if (type === 'referee') root.innerHTML = refereeModal(id);
  else if (type === 'referee-view') root.innerHTML = refereeViewModal(id);
}
function modalFrame(title, desc, contents, wide = false) {
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div><h2>${title}</h2><p>${desc}</p></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div>${contents}</section></div>`;
}
function studentModal(id) {
  const existing = data.students.find(item => item.id === id);
  const locked = !isOrganiser() && !data.registrationOpen;
  const title = existing ? 'Edit participant' : 'Add participant';
  const content = `<form id="student-form" class="modal-form" data-id="${existing?.id || ''}"><div class="form-grid"><div class="field"><label>Student ID</label><div class="readonly-field">${existing?.id || nextStudentCode()} · automatic</div></div><div class="field"><label>Age on match day</label><div class="readonly-field" id="age-preview">${existing ? (ageAtMatch(existing.dob) ?? '—') : 'Calculated from date of birth'}</div></div><div class="field full"><label for="student-name">Student name</label><input id="student-name" name="name" required maxlength="100" value="${esc(existing?.name || '')}" placeholder="Full name"></div><div class="field"><label for="student-dob">Date of birth</label><input id="student-dob" name="dob" type="date" max="${MATCH_DATE}" required value="${esc(existing?.dob || '')}"></div><div class="field"><label for="student-category">Category</label><select id="student-category" name="category" required><option value="INDIVIDUAL" ${existing?.category !== 'FIGHT' ? 'selected' : ''}>Individual</option><option value="FIGHT" ${existing?.category === 'FIGHT' ? 'selected' : ''}>Fight</option></select></div></div><div class="note" style="margin-bottom:14px">Age is calculated for the event date, 25 October 2026. New registrations are submitted as PENDING for organiser review.</div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" ${locked ? 'disabled' : ''}>${existing ? 'Save changes' : 'Review registration'}</button></div></form>`;
  return modalFrame(title, existing ? `${existing.id} · ${isOrganiser() ? 'Organiser edit' : 'Update academy record'}` : 'Register a student for the district match.', content);
}
function studentConfirmModal(values) {
  const institute = currentInstitute();
  const group = ageGroup(ageAtMatch(values.dob));
  const academy = isOrganiser() ? instituteById(values.instituteId)?.academyName : institute?.academyName;
  const content = `<div class="modal-form"><div class="confirm-summary"><span>Student ID<strong>${nextStudentCode()}</strong></span><span>Name<strong>${esc(values.name)}</strong></span><span>Age on match day<strong>${ageAtMatch(values.dob)}${group ? ` · ${esc(group.label)}` : ''}</strong></span><span>Category<strong>${values.category === 'FIGHT' ? 'Fight' : 'Individual'}</strong></span><span>Academy<strong>${esc(academy || 'Tournament entry')}</strong></span><span>Status<strong>PENDING organiser review</strong></span></div><div class="modal-actions" style="margin-top:17px"><button type="button" class="btn btn-outline" data-action="edit-confirm-student">Back</button><button type="button" class="btn btn-primary" data-action="confirm-student">Confirm registration</button></div></div>`;
  return modalFrame('Review registration', 'Check these details before submitting.', content);
}
function instituteModal() {
  const nextInstitute = nextId(data.institutes, 'INS', 3);
  const content = `<form id="institute-form" class="modal-form"><div class="form-grid"><div class="field"><label>Institute ID</label><div class="readonly-field">${nextInstitute} · automatic</div></div><div class="field"><label for="institute-login">Institute login ID</label><input id="institute-login" name="loginId" required maxlength="30" placeholder="e.g. VEERA01"></div><div class="field full"><label for="academy-name">Academy name</label><input id="academy-name" name="academyName" required maxlength="120" placeholder="Silambam academy name"></div><div class="field"><label for="master-name">Master name</label><input id="master-name" name="masterName" required maxlength="100" placeholder="Full name"></div><div class="field"><label for="institute-phone">Phone number</label><input id="institute-phone" name="phone" type="tel" pattern="[0-9+() -]{8,16}" required placeholder="Contact number"></div><div class="field full"><label for="institute-password">Temporary password</label><input id="institute-password" name="password" type="password" minlength="8" required placeholder="At least 8 characters"><small class="muted">Demo only: password is not stored or used for real authentication.</small></div></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Create institute</button></div></form>`;
  return modalFrame('Create institute account', 'Add an academy to the event directory.', content, true);
}
function refereeModal(id) {
  const existing = data.referees.find(item => item.id === id);
  const content = `<form id="referee-form" class="modal-form" data-id="${existing?.id || ''}"><div class="form-grid"><div class="field full"><label for="referee-name">Referee name</label><input id="referee-name" name="name" required maxlength="100" value="${esc(existing?.name || '')}" placeholder="Full name"></div><div class="field"><label for="referee-age">Age</label><input id="referee-age" name="age" type="number" min="18" max="100" required value="${existing?.age || ''}" placeholder="Age"></div><div class="field"><label for="referee-phone">Phone number</label><input id="referee-phone" name="phone" type="tel" pattern="[0-9+() -]{8,16}" required value="${esc(existing?.phone || '')}" placeholder="Contact number"></div><div class="field full"><label for="referee-academy">Academy name</label><input id="referee-academy" name="academyName" required maxlength="120" value="${esc(existing?.academyName || currentInstitute()?.academyName || '')}" placeholder="Academy"></div></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${existing ? 'Save changes' : 'Add referee'}</button></div></form>`;
  return modalFrame(existing ? 'Edit referee' : 'Add referee', 'Referee contact for the district match.', content);
}
function refereeViewModal(id) {
  const referee = data.referees.find(item => item.id === id);
  if (!referee) return '';
  const content = `<div class="modal-form"><div class="confirm-summary"><span>Name<strong>${esc(referee.name)}</strong></span><span>Age<strong>${referee.age}</strong></span><span>Academy<strong>${esc(referee.academyName)}</strong></span><span>Phone<strong>${esc(referee.phone)}</strong></span></div><div class="modal-actions"><button type="button" class="btn btn-primary" data-action="close-modal">Done</button></div></div>`;
  return modalFrame('Referee details', instituteById(referee.instituteId)?.academyName || 'Event referee', content);
}

function login(role, instituteId = null) {
  session = role === 'ORGANISER' ? { role } : { role, instituteId };
  persistSession();
  activePage = 'dashboard';
  searchText = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';
  instituteFilter = 'ALL';
  ageGroupFilter = 'ALL';
  render();
}
function logout() { session = null; sessionStorage.removeItem(SESSION_KEY); activePage = 'dashboard'; render(); }
function closeModal() { modalState = null; renderModal(); }
function toggleRegistration() {
  data.registrationOpen = !data.registrationOpen;
  persist();
  render();
  toast(`Registration ${data.registrationOpen ? 'reopened' : 'closed'}.`);
}
function generatePitches() {
  const verified = data.students.filter(student => student.status === 'VERIFIED');
  const grouped = new Map();
  for (const student of verified) {
    const group = ageGroup(ageAtMatch(student.dob));
    if (!group) continue;
    const key = `${student.category}|${group.label}`;
    if (!grouped.has(key)) grouped.set(key, { category: student.category, ageGroup: group.label, students: [] });
    grouped.get(key).students.push(student.id);
  }
  data.pitches = [...grouped.values()].sort((a, b) => ({ INDIVIDUAL: 0, FIGHT: 1 }[a.category] ?? 99) - ({ INDIVIDUAL: 0, FIGHT: 1 }[b.category] ?? 99) || data.ageGroups.findIndex(group => group.label === a.ageGroup) - data.ageGroups.findIndex(group => group.label === b.ageGroup)).map((pitch, index) => ({ ...pitch, number: index + 1 }));
  persist();
  render();
  toast(`${data.pitches.length} pitch${data.pitches.length === 1 ? '' : 'es'} generated from verified participants.`);
}

function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function downloadCsv(filename, headers, rows) {
  const content = '\ufeff' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  toast(`${filename} downloaded.`);
}
function exportData(type, instituteId = null) {
  if (type === 'students' || type === 'individual' || type === 'fight') {
    let students = instituteId ? instituteStudents(instituteId) : data.students;
    if (type === 'individual') students = students.filter(student => student.category === 'INDIVIDUAL');
    if (type === 'fight') students = students.filter(student => student.category === 'FIGHT');
    downloadCsv('district-participants.csv', ['Student ID', 'Student name', 'Date of birth', 'Age on 25 Oct 2026', 'Category', 'Institute ID', 'Academy', 'Master', 'Status'], students.map(student => { const owner = instituteById(student.instituteId); return [student.id, student.name, student.dob, ageAtMatch(student.dob), student.category, student.instituteId, owner?.academyName, owner?.masterName, student.status]; }));
  } else if (type === 'institutes') {
    downloadCsv('district-institutes.csv', ['Institute ID', 'Login ID', 'Academy', 'Master', 'Phone', 'Participants', 'Individual', 'Fight', 'Referees'], data.institutes.map(item => { const stats = allStats(instituteStudents(item.id)); return [item.id, item.loginId, item.academyName, item.masterName, item.phone, stats.total, stats.individual, stats.fight, instituteReferees(item.id).length]; }));
  } else if (type === 'referees') {
    downloadCsv('district-referees.csv', ['Name', 'Age', 'Academy', 'Phone', 'Institute ID'], data.referees.map(item => [item.name, item.age, item.academyName, item.phone, item.instituteId]));
  } else if (type === 'pitches') {
    downloadCsv('district-pitches.csv', ['Pitch', 'Category', 'Age group', 'Order', 'Student ID', 'Name', 'Academy'], data.pitches.flatMap(pitch => pitch.students.map((id, index) => { const student = data.students.find(item => item.id === id); return [pitch.number, pitch.category, pitch.ageGroup, index + 1, id, student?.name, instituteById(student?.instituteId)?.academyName]; })));
  } else if (type === 'complete') {
    const rows = [
      ...data.institutes.map(item => ['INSTITUTE', item.id, item.academyName, item.createdAt, 'INSTITUTE', item.id, item.academyName, item.phone, 'ACTIVE']),
      ...data.students.map(item => { const owner = instituteById(item.instituteId); return ['PARTICIPANT', item.id, item.name, `${item.dob} (age ${ageAtMatch(item.dob)})`, item.category, item.instituteId, owner?.academyName, '', item.status]; }),
      ...data.referees.map(item => ['REFEREE', item.id, item.name, item.age, 'REFEREE', item.instituteId, item.academyName, item.phone, 'REGISTERED']),
      ...data.pitches.flatMap(pitch => pitch.students.map((id, index) => { const student = data.students.find(item => item.id === id); return ['PITCH', `PITCH ${String(pitch.number).padStart(2, '0')}`, student?.name, index + 1, `${pitch.category} · ${pitch.ageGroup}`, student?.instituteId, instituteById(student?.instituteId)?.academyName, '', 'VERIFIED']; }))
    ];
    downloadCsv('district-complete-report.csv', ['Record type', 'ID', 'Name', 'Age or date', 'Category or role', 'Institute ID', 'Academy', 'Contact', 'Status'], rows);
  }
}

document.addEventListener('click', event => {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) { activePage = pageButton.dataset.page; searchText = ''; render(); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'demo-login') login(button.dataset.role, button.dataset.role === 'INSTITUTE' ? 'INS001' : null);
  else if (action === 'logout') logout();
  else if (action === 'close-modal') closeModal();
  else if (action === 'backdrop-close' && event.target === button) closeModal();
  else if (action === 'mobile-menu') toast('Use the navigation bar at the bottom of the screen.');
  else if (action === 'add-student') { if (!data.registrationOpen) toast('Registration is closed.', true); else { modalState = { type: 'student' }; renderModal(); } }
  else if (action === 'edit-student') { modalState = { type: 'student', id: button.dataset.id }; renderModal(); }
  else if (action === 'delete-student') deleteStudent(button.dataset.id);
  else if (action === 'verify-student') verifyStudent(button.dataset.id);
  else if (action === 'set-student-status') setStudentStatus(button.dataset.id, button.dataset.status);
  else if (action === 'add-institute') { modalState = { type: 'institute' }; renderModal(); }
  else if (action === 'view-institute') { selectedInstitute = button.dataset.id; activePage = 'institute-detail'; render(); }
  else if (action === 'add-referee') { if (!data.registrationOpen) toast('Registration is closed.', true); else { modalState = { type: 'referee' }; renderModal(); } }
  else if (action === 'edit-referee') { modalState = { type: 'referee', id: button.dataset.id }; renderModal(); }
  else if (action === 'delete-referee') deleteReferee(button.dataset.id);
  else if (action === 'view-referee') { modalState = { type: 'referee-view', id: button.dataset.id }; renderModal(); }
  else if (action === 'toggle-registration') toggleRegistration();
  else if (action === 'generate-pitches') generatePitches();
  else if (action === 'download') exportData(button.dataset.type);
  else if (action === 'export-institute') exportData('students', button.dataset.id);
  else if (action === 'print-pitches') window.print();
  else if (action === 'confirm-student') confirmStudent();
  else if (action === 'edit-confirm-student') { const values = modalState.values; modalState = { type: 'student' }; renderModal(); setTimeout(() => { const form = document.querySelector('#student-form'); if (form) { form.elements.name.value = values.name; form.elements.dob.value = values.dob; form.elements.category.value = values.category; } }, 0); }
});

document.addEventListener('submit', event => {
  if (event.target.id === 'login-form') {
    event.preventDefault();
    toast('Credential sign-in requires the secure backend. Use a demo preview to explore this local prototype.', true);
  } else if (event.target.id === 'student-form') {
    event.preventDefault();
    if (!data.registrationOpen && !isOrganiser()) { toast('Registration is closed.', true); closeModal(); return; }
    const form = new FormData(event.target);
    const values = { name: String(form.get('name')).trim(), dob: String(form.get('dob')), category: String(form.get('category')), instituteId: event.target.dataset.id ? data.students.find(student => student.id === event.target.dataset.id)?.instituteId : currentInstitute()?.id };
    if (!values.name || ageAtMatch(values.dob) === null) { toast('Enter a valid name and date of birth before the match date.', true); return; }
    const existing = data.students.find(student => student.id === event.target.dataset.id);
    if (existing) { Object.assign(existing, { name: values.name, dob: values.dob, category: values.category, ...(isOrganiser() ? {} : { status: 'PENDING' }) }); invalidatePitches(); persist(); modalState = null; render(); toast('Participant updated.'); }
    else { modalState = { type: 'student-confirm', values }; renderModal(); }
  } else if (event.target.id === 'institute-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    const loginId = String(form.get('loginId')).trim();
    if (data.institutes.some(item => item.loginId.toLowerCase() === loginId.toLowerCase())) { toast('That login ID is already in use.', true); return; }
    const institute = { id: nextId(data.institutes, 'INS', 3), loginId, academyName: String(form.get('academyName')).trim(), masterName: String(form.get('masterName')).trim(), phone: String(form.get('phone')).trim(), createdAt: new Date().toISOString().slice(0, 10) };
    data.institutes.push(institute); persist(); modalState = null; render(); toast(`${institute.id} created. The local prototype does not store passwords.`);
  } else if (event.target.id === 'referee-form') {
    event.preventDefault();
    if (!data.registrationOpen && !isOrganiser()) { toast('Registration is closed.', true); closeModal(); return; }
    const form = new FormData(event.target);
    const id = event.target.dataset.id;
    const existing = data.referees.find(referee => referee.id === id);
    const values = { name: String(form.get('name')).trim(), age: Number(form.get('age')), phone: String(form.get('phone')).trim(), academyName: String(form.get('academyName')).trim() };
    if (existing) Object.assign(existing, values);
    else data.referees.push({ id: nextId(data.referees, 'REF'), instituteId: currentInstitute().id, ...values });
    persist(); modalState = null; render(); toast(existing ? 'Referee updated.' : 'Referee added.');
  } else if (event.target.id === 'age-groups-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    const limits = data.ageGroups.map((group, index) => Number(form.get(`max-${index}`)));
    for (let index = 0; index < limits.length; index++) {
      if (!Number.isInteger(limits[index]) || limits[index] < data.ageGroups[index].min || limits[index] > 99 || (index > 0 && limits[index] <= limits[index - 1])) { toast('Each maximum age must be greater than the previous band and within 0–99.', true); return; }
    }
    data.ageGroups.forEach((group, index) => { group.max = limits[index]; if (index + 1 < data.ageGroups.length) data.ageGroups[index + 1].min = limits[index] + 1; });
    persist(); render(); toast('Age bands saved. Regenerate pitches to apply the changes.');
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'student-dob') {
    const preview = document.querySelector('#age-preview');
    if (preview) preview.textContent = ageAtMatch(event.target.value) ?? 'Enter a valid date';
  }
  if (event.target.id === 'participant-search') {
    const position = event.target.selectionStart;
    searchText = event.target.value;
    const scrollY = window.scrollY;
    render();
    const replacement = document.querySelector('#participant-search');
    replacement?.focus(); replacement?.setSelectionRange(position, position);
    window.scrollTo(0, scrollY);
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'status-filter') { statusFilter = event.target.value; render(); }
  else if (event.target.id === 'category-filter') { categoryFilter = event.target.value; render(); }
  else if (event.target.id === 'age-group-filter') { ageGroupFilter = event.target.value; render(); }
  else if (event.target.id === 'institute-filter') {
    instituteFilter = event.target.value;
    render();
  }
});

function confirmStudent() {
  if (!data.registrationOpen && !isOrganiser()) { toast('Registration is closed.', true); closeModal(); return; }
  const values = modalState?.values;
  if (!values) return;
  data.students.push({ id: nextStudentCode(), instituteId: values.instituteId || data.institutes[0]?.id, name: values.name, dob: values.dob, category: values.category, status: 'PENDING', createdAt: new Date().toISOString().slice(0, 10) });
  data.studentSequence++;
  const student = data.students[data.students.length - 1];
  invalidatePitches();
  persist(); modalState = null; render(); toast(`Student registered successfully · ${student.id}`);
}
function verifyStudent(id) {
  const student = data.students.find(item => item.id === id);
  if (!student) return;
  setStudentStatus(id, 'VERIFIED');
}
function setStudentStatus(id, status) {
  const student = data.students.find(item => item.id === id);
  if (!student || !['PENDING', 'CONFIRMED', 'VERIFIED', 'REJECTED'].includes(status)) return;
  student.status = status;
  invalidatePitches();
  persist(); render(); toast(`${student.id} status changed to ${status}.`);
}
function invalidatePitches() {
  if (data.pitches.length) data.pitches = [];
}
function deleteStudent(id) {
  if (!data.registrationOpen && !isOrganiser()) { toast('Registration is closed.', true); return; }
  const student = data.students.find(item => item.id === id);
  if (!student || !confirm(`Delete ${student.name} (${student.id})?`)) return;
  data.students = data.students.filter(item => item.id !== id);
  invalidatePitches();
  persist(); render(); toast('Participant deleted.');
}
function deleteReferee(id) {
  if (!data.registrationOpen && !isOrganiser()) { toast('Registration is closed.', true); return; }
  const referee = data.referees.find(item => item.id === id);
  if (!referee || !confirm(`Delete referee ${referee.name}?`)) return;
  data.referees = data.referees.filter(item => item.id !== id);
  persist(); render(); toast('Referee deleted.');
}

render();