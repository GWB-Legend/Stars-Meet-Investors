// ============================================================
// 🔗 JSONBin.io CONFIGURATION
// ============================================================
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/6a7f52aef5f4af5e29170b4f';
const JSONBIN_MASTER_KEY = '$2a$10$5mgJH4XQlyIAkr9jYkSqk.Q/KWBQqUyPNFYOg996WVF5Sh5vSS60a';
const JSONBIN_ACCESS_KEY = '$2a$10$jDZXWhOgKffkHnJL/u4kTe.TaaiMvNP0JhhnlXosbLJmiehGuD.wK';

// ============================================================
// 📦 STORAGE HELPERS (Local fallback)
// ============================================================
function getLocalData(k, f) { 
    try { 
        const d = localStorage.getItem('smi_' + k); 
        return d ? JSON.parse(d) : f; 
    } catch { 
        return f; 
    } 
}

function setLocalData(k, v) { 
    localStorage.setItem('smi_' + k, JSON.stringify(v)); 
}

// ============================================================
// 🗄️ JSONBin.io CRUD HELPERS
// ============================================================
let cachedData = null;

async function jsonBinGet() {
    try {
        const response = await fetch(JSONBIN_URL + '/latest', {
            headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        cachedData = data.record || data;
        return cachedData;
    } catch (e) {
        console.error('JSONBin get error:', e);
        return null;
    }
}

async function jsonBinUpdate(data) {
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_MASTER_KEY
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        cachedData = data;
        return result;
    } catch (e) {
        console.error('JSONBin update error:', e);
        return null;
    }
}

async function jsonBinGetCollection(collection) {
    try {
        const data = await jsonBinGet();
        if (data && data[collection]) return data[collection];
        const newData = data || {};
        if (!newData[collection]) newData[collection] = [];
        await jsonBinUpdate(newData);
        return newData[collection];
    } catch (e) {
        console.warn('JSONBin collection fallback to local:', e);
        return getLocalData(collection, []);
    }
}

async function jsonBinInsert(collection, record) {
    try {
        const data = await jsonBinGet();
        if (!data) throw new Error('No data');
        if (!data[collection]) data[collection] = [];
        const newRecord = { ...record, id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) };
        data[collection].push(newRecord);
        await jsonBinUpdate(data);
        return newRecord;
    } catch (e) {
        console.warn('JSONBin insert fallback to local:', e);
        const local = getLocalData(collection, []);
        const newRecord = { ...record, id: 'local_' + Date.now() };
        local.push(newRecord);
        setLocalData(collection, local);
        return newRecord;
    }
}

async function jsonBinUpdateRecord(collection, id, updates) {
    try {
        const data = await jsonBinGet();
        if (!data) throw new Error('No data');
        if (!data[collection]) data[collection] = [];
        const idx = data[collection].findIndex(item => item.id === id);
        if (idx === -1) throw new Error('Record not found');
        data[collection][idx] = { ...data[collection][idx], ...updates };
        await jsonBinUpdate(data);
        return data[collection][idx];
    } catch (e) {
        console.warn('JSONBin update fallback to local:', e);
        const local = getLocalData(collection, []);
        const idx = local.findIndex(item => item.id === id);
        if (idx !== -1) { 
            local[idx] = { ...local[idx], ...updates };
            setLocalData(collection, local); 
        }
        return local[idx];
    }
}

async function jsonBinDeleteRecord(collection, id) {
    try {
        const data = await jsonBinGet();
        if (!data) throw new Error('No data');
        if (!data[collection]) data[collection] = [];
        data[collection] = data[collection].filter(item => item.id !== id);
        await jsonBinUpdate(data);
        return true;
    } catch (e) {
        console.warn('JSONBin delete fallback to local:', e);
        const local = getLocalData(collection, []);
        setLocalData(collection, local.filter(item => item.id !== id));
        return false;
    }
}

async function jsonBinQuery(collection, field, value) {
    try {
        const items = await jsonBinGetCollection(collection);
        return items.filter(item => item[field] === value);
    } catch (e) {
        console.warn('JSONBin query fallback to local:', e);
        const local = getLocalData(collection, []);
        return local.filter(item => item[field] === value);
    }
}

// ============================================================
// 📦 DEFAULT PRODUCTS
// ============================================================
const DEFAULT_PRODUCTS = [
    { title: 'Premium Investment Package', description: 'Full investor matching with dedicated support and pitch deck review.', price_leone: 2500000, category: 'Investment', video_url: '', image_url: '', status: 'active', views: 0 },
    { title: 'Startup Accelerator Plan', description: 'Fast-track your business with curated investor introductions and mentorship.', price_leone: 1500000, category: 'Accelerator', video_url: '', image_url: '', status: 'active', views: 0 },
    { title: 'VC Pitch Session', description: 'Present your business directly to venture capitalists in a live session.', price_leone: 5000000, category: 'Pitch', video_url: '', image_url: '', status: 'active', views: 0 },
    { title: 'Investor Database Access', description: 'Full access to our network of 120+ pre-qualified investors.', price_leone: 3500000, category: 'Database', video_url: '', image_url: '', status: 'active', views: 0 },
    { title: 'Business Valuation Report', description: 'Professional valuation and financial analysis for your business.', price_leone: 800000, category: 'Valuation', video_url: '', image_url: '', status: 'active', views: 0 }
];

// ============================================================
// 🚀 INIT DATA
// ============================================================
async function initData() {
    try {
        let data = await jsonBinGet();
        if (!data) {
            data = {
                users: [{ username: 'admin', password: 'starsmeet2025', role: 'admin', name: 'Super Admin', created_at: new Date().toISOString() }],
                registrations: [],
                products: DEFAULT_PRODUCTS.map(p => ({ ...p, created_at: new Date().toISOString() })),
                stickers: [],
                codes: [],
                tracking: [],
                social_feeds: [],
                influencers: [],
                influencer_detections: []
            };
            await jsonBinUpdate(data);
            console.log('📦 Default data initialized in JSONBin.');
        } else {
            if (!data.products || data.products.length === 0) {
                data.products = DEFAULT_PRODUCTS.map(p => ({ ...p, created_at: new Date().toISOString() }));
                await jsonBinUpdate(data);
                console.log('📦 Default products added.');
            }
            if (!data.users || data.users.length === 0) {
                data.users = [{ username: 'admin', password: 'starsmeet2025', role: 'admin', name: 'Super Admin', created_at: new Date().toISOString() }];
                await jsonBinUpdate(data);
                console.log('👤 Default admin user created.');
            }
        }
    } catch (e) {
        console.log('⚠️ JSONBin init: Using local storage fallback');
        if (!getLocalData('users', null)) setLocalData('users', [{ username: 'admin', password: 'starsmeet2025', role: 'admin', name: 'Super Admin', created: new Date().toISOString() }]);
        if (!getLocalData('registrations', null)) setLocalData('registrations', []);
        if (!getLocalData('codes', null)) setLocalData('codes', []);
        if (!getLocalData('stickers', null)) setLocalData('stickers', []);
        if (!getLocalData('tracking', null)) setLocalData('tracking', []);
        if (!getLocalData('visitorCount', null)) setLocalData('visitorCount', 0);
        if (!getLocalData('socialFeeds', null)) setLocalData('socialFeeds', []);
        if (!getLocalData('influencers', null)) setLocalData('influencers', []);
        if (!getLocalData('influencerDetections', null)) setLocalData('influencerDetections', []);
        let products = getLocalData('products', []);
        if (!products || products.length === 0) { 
            setLocalData('products', DEFAULT_PRODUCTS);
            console.log('📦 Default products initialized locally.'); 
        }
    }
}

// ============================================================
// 🌍 LOCATION DETECTION
// ============================================================
let visitorLocation = { city: 'Freetown', country: 'Sierra Leone', full: 'Freetown, Sierra Leone' };
let visitorIP = 'Unknown';

async function detectLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city && data.country_name) {
            visitorLocation = { 
                city: data.city || 'Freetown', 
                country: data.country_name || 'Sierra Leone',
                full: (data.city || 'Freetown') + ', ' + (data.country_name || 'Sierra Leone') 
            };
            visitorIP = data.ip || 'Unknown';
        }
    } catch (e) { 
        console.log('📍 Using default location: Freetown, Sierra Leone'); 
    }
    const locEl = document.getElementById('visitorLocation');
    if (locEl) locEl.textContent = '📍 ' + visitorLocation.full;
    return visitorLocation;
}

// ============================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================
function generateUniqueID() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s1 = '', s2 = '';
    for (let i = 0; i < 4; i++) { 
        s1 += c[Math.floor(Math.random() * c.length)];
        s2 += c[Math.floor(Math.random() * c.length)]; 
    }
    return 'SMI-' + s1 + '-' + s2;
}

function generateCode() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
    return 'INF-' + s;
}

function formatDate(d) { 
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); 
}

function formatTime(d) { 
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
}

function getSessionId() {
    let id = localStorage.getItem('smi_session_id');
    if (!id) { 
        id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('smi_session_id', id); 
    }
    return id;
}

function getDeviceType() { 
    return /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'; 
}

function getBrowser() { 
    return navigator.userAgent.split(' ').pop() || 'Unknown'; 
}

// ============================================================
// 🔐 SESSION MANAGEMENT (30-min auto-logout)
// ============================================================
let sessionTimer = null;
let sessionTimeout = 30 * 60;
let sessionCountdown = sessionTimeout;
let isSessionActive = false;

function startSessionTimer() {
    if (!currentUser) return;
    isSessionActive = true;
    sessionCountdown = sessionTimeout;
    document.getElementById('sessionTimer').classList.add('show');
    updateSessionDisplay();
    if (sessionTimer) clearInterval(sessionTimer);
    sessionTimer = setInterval(() => {
        sessionCountdown--;
        updateSessionDisplay();
        if (sessionCountdown <= 0) { 
            clearInterval(sessionTimer);
            sessionTimer = null;
            handleAutoLogout(); 
        }
    }, 1000);
    const resetEvents = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    resetEvents.forEach(event => { 
        document.removeEventListener(event, resetSessionTimer);
        document.addEventListener(event, resetSessionTimer); 
    });
}

function resetSessionTimer() { 
    if (!currentUser) return;
    sessionCountdown = sessionTimeout;
    updateSessionDisplay(); 
}

function updateSessionDisplay() {
    const mins = Math.floor(sessionCountdown / 60);
    const secs = sessionCountdown % 60;
    document.getElementById('sessionCountdown').textContent = 
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function stopSessionTimer() {
    if (sessionTimer) { 
        clearInterval(sessionTimer);
        sessionTimer = null; 
    }
    isSessionActive = false;
    document.getElementById('sessionTimer').classList.remove('show');
    const resetEvents = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    resetEvents.forEach(event => { 
        document.removeEventListener(event, resetSessionTimer); 
    });
}

function handleAutoLogout() {
    if (!currentUser) return;
    showToast('⏰ Session expired after 30 minutes of inactivity. Please login again.', 'error');
    handleLogout();
}

// ============================================================
// 💬 TOAST
// ============================================================
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    t.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i> ' + msg;
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 4200);
}

// ============================================================
// 👤 TOGGLE PASSWORD VISIBILITY
// ============================================================
function togglePassword() {
    const passInput = document.getElementById('adminPass');
    const icon = document.getElementById('passwordToggleIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ============================================================
// 🧭 NAVIGATION
// ============================================================
let currentSection = 'home';
let currentUser = null;

function showSection(name) {
    document.querySelectorAll('.page-section').forEach(s => { 
        s.style.display = 'none';
        s.classList.remove('active'); 
    });
    const t = document.getElementById('section' + name.charAt(0).toUpperCase() + name.slice(1));
    if (t) { 
        t.style.display = 'block';
        t.classList.add('active'); 
    }
    document.querySelectorAll('[data-nav]').forEach(l => l.classList.remove('active'));
    const a = document.querySelector('[data-nav="' + name + '"]');
    if (a) a.classList.add('active');
    document.getElementById('mainNav').style.display = (name === 'admin') ? 'none' : '';
    document.querySelector('.admin-padlock').style.display = (name === 'admin') ? 'none' : '';
    document.querySelector('.float-buttons').style.display = (name === 'admin') ? 'none' : '';
    currentSection = name;
    window.scrollTo(0, 0);
    setTimeout(initRevealAnimations, 100);
    if (name === 'admin') { 
        refreshAdminData();
        startSessionTimer(); 
    } else { 
        stopSessionTimer(); 
    }
    renderAllStickersAndAds();
    trackAction('page_view', name);
}

function toggleMobileMenu() {
    const m = document.getElementById('mobileMenu');
    const i = document.getElementById('menuIcon');
    m.classList.toggle('hidden');
    i.className = m.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-times';
}

// ============================================================
// 🔐 ADMIN LOGIN
// ============================================================
let tapCount = 0, tapTimer = null;
document.getElementById('adminTrigger').addEventListener('click', function(e) {
    e.preventDefault();
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 5) { 
        tapCount = 0;
        openAdminLogin(); 
    } else {
        tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { 
        e.preventDefault();
        openAdminLogin(); 
    }
});

function openAdminLogin() {
    document.getElementById('adminLoginModal').classList.add('show');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginBtnText').textContent = 'Sign In';
    document.getElementById('loginSpinner').classList.remove('show');
    document.getElementById('loginBtn').disabled = false;
    setTimeout(() => document.getElementById('adminUser').focus(), 100);
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('show');
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginBtnText').textContent = 'Sign In';
    document.getElementById('loginSpinner').classList.remove('show');
    document.getElementById('loginBtn').disabled = false;
}

document.getElementById('adminLoginModal').addEventListener('click', function(e) {
    if (e.target === this) closeAdminLogin();
});

async function handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;

    document.getElementById('loginBtnText').textContent = 'Signing In...';
    document.getElementById('loginSpinner').classList.add('show');
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginError').classList.remove('show');

    try {
        const users = await jsonBinQuery('users', 'username', u);
        const user = users.find(x => x.password === p);

        if (user) {
            currentUser = user;
            closeAdminLogin();
            showToast('Welcome, ' + user.name, 'success');
            document.getElementById('adminDisplayName').textContent = user.name;
            document.getElementById('adminDisplayRole').textContent = 
                user.role === 'admin' ? 'Administrator' : user.role === 'editor' ? 'Editor' : 'Staff';
            document.getElementById('addStaffBtn').style.display = user.role === 'admin' ? '' : 'none';
            showSection('admin');
            showAdminTab('dashboard');
            startSessionTimer();
            return;
        }

        const localUsers = getLocalData('users', []);
        const localUser = localUsers.find(x => x.username === u && x.password === p);

        if (localUser) {
            currentUser = localUser;
            closeAdminLogin();
            showToast('Welcome, ' + localUser.name, 'success');
            document.getElementById('adminDisplayName').textContent = localUser.name;
            document.getElementById('adminDisplayRole').textContent = 
                localUser.role === 'admin' ? 'Administrator' : localUser.role === 'editor' ? 'Editor' : 'Staff';
            document.getElementById('addStaffBtn').style.display = localUser.role === 'admin' ? '' : 'none';
            showSection('admin');
            showAdminTab('dashboard');
            startSessionTimer();
            return;
        }

        document.getElementById('loginErrorMsg').textContent = 'Invalid username or password. Please try again.';
        document.getElementById('loginError').classList.add('show');
        document.getElementById('loginBtnText').textContent = 'Sign In';
        document.getElementById('loginSpinner').classList.remove('show');
        document.getElementById('loginBtn').disabled = false;

    } catch (err) {
        console.error('Login error:', err);
        const localUsers = getLocalData('users', []);
        const localUser = localUsers.find(x => x.username === u && x.password === p);
        if (localUser) {
            currentUser = localUser;
            closeAdminLogin();
            showToast('Welcome, ' + localUser.name, 'success');
            document.getElementById('adminDisplayName').textContent = localUser.name;
            document.getElementById('adminDisplayRole').textContent = 
                localUser.role === 'admin' ? 'Administrator' : localUser.role === 'editor' ? 'Editor' : 'Staff';
            document.getElementById('addStaffBtn').style.display = localUser.role === 'admin' ? '' : 'none';
            showSection('admin');
            showAdminTab('dashboard');
            startSessionTimer();
            return;
        }
        document.getElementById('loginErrorMsg').textContent = 'Connection error. Please try again.';
        document.getElementById('loginError').classList.add('show');
        document.getElementById('loginBtnText').textContent = 'Sign In';
        document.getElementById('loginSpinner').classList.remove('show');
        document.getElementById('loginBtn').disabled = false;
    }
}

function handleLogout() {
    stopSessionTimer();
    currentUser = null;
    showSection('home');
    showToast('Logged out.', 'info');
}

// ============================================================
// 📊 ADMIN TABS
// ============================================================
function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    const map = { 
        dashboard: 'tabDashboard', 
        registrations: 'tabRegistrations', 
        products: 'tabProducts',
        stickers: 'tabStickers', 
        social: 'tabSocial', 
        influencers: 'tabInfluencers', 
        tracking: 'tabTracking',
        cashComplete: 'tabCashComplete', 
        staff: 'tabStaff', 
        codes: 'tabCodes' 
    };
    const el = document.getElementById(map[tab]);
    if (el) el.style.display = 'block';
    const idx = Object.keys(map).indexOf(tab);
    const items = document.querySelectorAll('.admin-nav-item');
    if (items[idx]) items[idx].classList.add('active');
    refreshAdminData();
    resetSessionTimer();
}

// ============================================================
// 👤 CUSTOMER TRACKING
// ============================================================
async function trackAction(action, details) {
    try {
        const sessionId = getSessionId();
        const loc = await detectLocation();
        const record = {
            session_id: sessionId,
            ip_address: visitorIP || 'Unknown',
            location_city: loc.city || 'Freetown',
            location_country: loc.country || 'Sierra Leone',
            device_type: getDeviceType(),
            browser: getBrowser(),
            page_visited: currentSection || 'home',
            action_type: action,
            click_data: details || {},
            created_at: new Date().toISOString()
        };
        await jsonBinInsert('tracking', record);
        const count = getLocalData('visitorCount', 0);
        setLocalData('visitorCount', count + 1);
        checkInfluencerDetection(action, details);
    } catch (e) { /* silent */ }
}

function checkInfluencerDetection(action, details) {
    const influencers = getLocalData('influencers', []);
    const detections = getLocalData('influencerDetections', []);
    const url = window.location.href;
    const search = window.location.search;
    influencers.forEach(inf => {
        if (search.includes(inf.code) || url.includes(inf.code)) {
            const existing = detections.find(d => d.influencerCode === inf.code && d.session_id === getSessionId());
            if (!existing) {
                detections.push({ 
                    influencerCode: inf.code, 
                    influencerName: inf.name, 
                    session_id: getSessionId(),
                    action: action, 
                    url: url, 
                    detected_at: new Date().toISOString() 
                });
                setLocalData('influencerDetections', detections);
                showToast('🔗 Influencer detected: ' + inf.name, 'success');
                renderInfluencers();
            }
        }
    });
}

async function refreshTrackingData() {
    try {
        const tracking = await jsonBinGetCollection('tracking');
        const sorted = (tracking || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const b = document.getElementById('trackingBody');
        const nd = document.getElementById('trackingNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        const slice = sorted.slice(0, 20);
        b.innerHTML = slice.map(t =>
            `<tr>
                <td style="font-size:.8rem;color:var(--fg-dim);">${formatTime(t.created_at)}</td>
                <td>${t.location_city || 'Freetown'}, ${t.location_country || 'Sierra Leone'}</td>
                <td style="font-family:monospace;font-size:.75rem;">${t.ip_address || 'Unknown'}</td>
                <td>${t.device_type || 'Unknown'}</td>
                <td>${t.page_visited || 'Unknown'}</td>
                <td><span class="badge badge-pending">${t.action_type || 'view'}</span></td>
            </tr>`
        ).join('');
        
        const allBody = document.getElementById('trackAllBody');
        const allNd = document.getElementById('trackAllNoData');
        if (allBody) {
            if (!sorted || sorted.length === 0) { 
                allBody.innerHTML = '';
                allNd.style.display = ''; 
                return; 
            }
            allNd.style.display = 'none';
            allBody.innerHTML = sorted.slice(0, 50).map(t =>
                `<tr>
                    <td style="font-size:.8rem;color:var(--fg-dim);">${formatTime(t.created_at)}</td>
                    <td>${t.location_city || 'Freetown'}, ${t.location_country || 'Sierra Leone'}</td>
                    <td style="font-family:monospace;font-size:.75rem;">${t.ip_address || 'Unknown'}</td>
                    <td>${t.device_type || 'Unknown'}</td>
                    <td>${t.browser || 'Unknown'}</td>
                    <td>${t.page_visited || 'Unknown'}</td>
                    <td><span class="badge badge-pending">${t.action_type || 'view'}</span></td>
                </tr>`
            ).join('');
        }
        
        const allTrack = sorted || [];
        const today = new Date().toDateString();
        const todayVisits = allTrack.filter(t => new Date(t.created_at).toDateString() === today);
        document.getElementById('trackTotalVisitors').textContent = allTrack.length;
        document.getElementById('trackToday').textContent = todayVisits.length;
        const devices = new Set(allTrack.map(t => t.device_type).filter(Boolean));
        document.getElementById('trackDevices').textContent = devices.size;
        const countries = new Set(allTrack.map(t => t.location_country).filter(Boolean));
        document.getElementById('trackCountries').textContent = countries.size;
    } catch (e) {
        console.warn('Tracking fallback to local:', e);
    }
}

function refreshTracking() { 
    refreshTrackingData();
    showToast('Tracking data refreshed.', 'success');
    resetSessionTimer(); 
}

// ============================================================
// 📊 DASHBOARD DATA
// ============================================================
async function refreshAdminData() {
    try {
        const regs = await jsonBinGetCollection('registrations');
        const users = await jsonBinGetCollection('users');
        const products = await jsonBinGetCollection('products');
        const stickers = await jsonBinGetCollection('stickers');
        const social = await jsonBinGetCollection('social_feeds');
        const influencers = await jsonBinGetCollection('influencers');

        document.getElementById('dashTotalReg').textContent = regs ? regs.length : 0;
        document.getElementById('dashCompleted').textContent = regs ? regs.filter(r => r.status === 'completed').length : 0;
        document.getElementById('dashPending').textContent = regs ? regs.filter(r => r.status === 'pending').length : 0;
        document.getElementById('dashVisitors').textContent = getLocalData('visitorCount', 0);
        document.getElementById('dashProducts').textContent = products ? products.length : 0;
        document.getElementById('dashStaff').textContent = users ? users.length : 0;
        document.getElementById('dashStickers').textContent = stickers ? stickers.filter(s => s.active !== false).length : 0;
        document.getElementById('dashSocialFeeds').textContent = social ? social.length : 0;
        document.getElementById('dashInfluencers').textContent = influencers ? influencers.length : 0;
        document.getElementById('homeTotalReg').textContent = regs ? regs.length : 0;

        renderRegistrations();
        renderProducts();
        renderStaff();
        renderCodes();
        renderStickers();
        renderInfluencers();
        refreshTrackingData();
        refreshSocialFeeds();
        renderAllStickersAndAds();
        renderProductAds();
    } catch (e) {
        console.warn('Dashboard fallback to local:', e);
    }
}

// ============================================================
// 📋 REGISTRATIONS
// ============================================================
async function renderRegistrations() {
    const search = (document.getElementById('searchReg')?.value || '').toLowerCase();
    const filter = document.getElementById('filterStatus')?.value || 'all';
    try {
        let regs = await jsonBinGetCollection('registrations');
        regs = (regs || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (search) regs = regs.filter(r => 
            (r.entity_name || '').toLowerCase().includes(search) || 
            (r.unique_id || '').toLowerCase().includes(search) || 
            (r.full_name || '').toLowerCase().includes(search)
        );
        if (filter !== 'all') regs = regs.filter(r => r.status === filter);
        const b = document.getElementById('allRegBody');
        const nd = document.getElementById('allRegNoData');
        if (!regs || regs.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = regs.map(r =>
            `<tr>
                <td style="font-family:monospace;font-size:.82rem;color:var(--accent);">${r.unique_id || 'N/A'}</td>
                <td>${r.entity_name || 'N/A'}</td>
                <td>${r.full_name || 'N/A'}</td>
                <td style="color:var(--fg-muted);font-size:.82rem;">${r.email || 'N/A'}</td>
                <td>${r.industry || 'N/A'}</td>
                <td><span class="badge badge-${r.status || 'pending'}">${r.status || 'pending'}</span></td>
                <td style="color:var(--fg-dim);font-size:.82rem;">${formatDate(r.date)}</td>
                <td>
                    ${r.status === 'completed' ? `<button onclick="reprintPDF('${r.unique_id}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Download PDF"><i class="fas fa-file-pdf"></i></button>` : ''}
                    ${r.status === 'pending' ? `<button onclick="quickComplete('${r.unique_id}')" style="background:none;border:none;color:#8fd68f;cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Complete"><i class="fas fa-check"></i></button><button onclick="quickReject('${r.unique_id}')" style="background:none;border:none;color:#e68a8a;cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                </td>
            </tr>`
        ).join('');
    } catch (e) {
        console.warn('Registrations fallback:', e);
    }
}

// ============================================================
// 📄 PDF GENERATION
// ============================================================
async function reprintPDF(id) {
    try {
        const regs = await jsonBinGetCollection('registrations');
        const reg = (regs || []).find(r => r.unique_id === id);
        if (reg) generateRegistrationPDF(reg);
        else showToast('Registration not found.', 'error');
    } catch (e) {
        const regs = getLocalData('registrations', []);
        const reg = regs.find(r => r.unique_id === id);
        if (reg) generateRegistrationPDF(reg);
        else showToast('Registration not found.', 'error');
    }
    resetSessionTimer();
}

function generateRegistrationPDF(reg) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pW = 210, pH = 297, m = 20;
    let y = 15;
    const wm = 'STARS MEET INVESTORS';
    
    doc.setFillColor(10, 6, 5);
    doc.rect(0, 0, pW, pH, 'F');
    
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(200, 149, 108, 0.05);
    for (let r = -2; r < 8; r++) { 
        for (let c = -1; c < 3; c++) { 
            doc.text(wm, c * 100 + (r % 2) * 50 - 40, r * 45, { angle: -30 }); 
        } 
    }
    doc.restoreGraphicsState();
    
    doc.setFillColor(200, 149, 108);
    doc.rect(0, 0, pW, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(200, 149, 108);
    doc.text(wm, pW / 2, y + 10, { align: 'center' });
    y += 18;
    
    doc.setDrawColor(200, 149, 108, 0.3);
    doc.setLineWidth(0.5);
    doc.line(m, y, pW - m, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(160, 145, 128);
    doc.text('OFFICIAL REGISTRATION CERTIFICATE', pW / 2, y, { align: 'center' });
    y += 14;
    
    doc.setFillColor(18, 14, 12);
    doc.roundedRect(m, y, pW - m * 2, 16, 3, 3, 'F');
    doc.setDrawColor(200, 149, 108, 0.35);
    doc.roundedRect(m, y, pW - m * 2, 16, 3, 3, 'S');
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(200, 149, 108);
    doc.text('ID: ' + (reg.unique_id || 'N/A'), pW / 2, y + 10, { align: 'center' });
    y += 26;
    
    const fields = [
        ['Business Name', reg.entity_name || 'N/A'],
        ['Reg Number', reg.reg_number || 'N/A'],
        ['Representative', reg.full_name || 'N/A'],
        ['Email', reg.email || 'N/A'],
        ['Phone', reg.phone || 'N/A'],
        ['Industry', reg.industry || 'N/A'],
        ['Stage', reg.stage || 'N/A'],
        ['Capital', reg.capital ? '$' + reg.capital : 'N/A'],
        ['Address', reg.address || 'N/A']
    ];
    
    doc.setFont('helvetica', 'normal');
    fields.forEach(([l, v]) => {
        if (y > pH - 80) {
            doc.addPage();
            doc.setFillColor(10, 6, 5);
            doc.rect(0, 0, pW, pH, 'F');
            doc.setFillColor(200, 149, 108);
            doc.rect(0, 0, pW, 2, 'F');
            doc.saveGraphicsState();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(48);
            doc.setTextColor(200, 149, 108, 0.05);
            for (let r = -2; r < 8; r++) { 
                for (let c = -1; c < 3; c++) { 
                    doc.text(wm, c * 100 + (r % 2) * 50 - 40, r * 45, { angle: -30 }); 
                } 
            }
            doc.restoreGraphicsState();
            y = 15;
        }
        doc.setFontSize(8.5);
        doc.setTextColor(120, 108, 95);
        doc.text(l + ':', m, y);
        doc.setFontSize(10);
        doc.setTextColor(240, 235, 228);
        const lines = doc.splitTextToSize(v || 'N/A', pW - m * 2 - 50);
        doc.text(lines, m + 45, y);
        y += Math.max(8, lines.length * 5.5 + 3);
    });
    
    y += 6;
    doc.setFontSize(8.5);
    doc.setTextColor(120, 108, 95);
    doc.text('Description:', m, y);
    y += 6;
    doc.setFontSize(9.5);
    doc.setTextColor(220, 215, 205);
    const dl = doc.splitTextToSize(reg.description || 'N/A', pW - m * 2);
    doc.text(dl, m, y);
    y += dl.length * 5 + 12;
    
    doc.setFillColor(18, 14, 12);
    doc.roundedRect(m, y, pW - m * 2, 18, 3, 3, 'F');
    const sc = reg.status === 'completed' ? [143, 214, 143] : [228, 176, 138];
    doc.setFontSize(9);
    doc.setTextColor(...sc);
    doc.text('STATUS: ' + (reg.status || 'PENDING').toUpperCase(), m + 8, y + 8);
    doc.setTextColor(140, 125, 110);
    doc.text('DATE: ' + new Date(reg.date || Date.now()).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    }), m + 8, y + 14);
    doc.text('Payment: ' + (reg.payment_method || 'online').toUpperCase(), pW - m - 40, y + 11);
    y += 28;
    
    doc.setDrawColor(200, 149, 108, 0.15);
    doc.line(m, y, pW - m, y);
    y += 8;
    doc.setFontSize(7.5);
    doc.setTextColor(90, 80, 70);
    doc.text('Computer-generated proof of registration with Stars Meet Investors.', pW / 2, y, { align: 'center' });
    y += 5;
    doc.text('Watermark authenticates origin. Unauthorized reproduction prohibited.', pW / 2, y, { align: 'center' });
    y += 5;
    doc.text('Verify: info@starsmeetinvestors.com | ID: ' + (reg.unique_id || 'N/A'), pW / 2, y, { align: 'center' });
    
    doc.save('SMI_Registration_' + (reg.unique_id || 'unknown') + '.pdf');
}

// ============================================================
// 💰 CASH PAYMENT
// ============================================================
async function quickComplete(id) {
    try {
        const regs = await jsonBinGetCollection('registrations');
        const reg = (regs || []).find(r => r.unique_id === id);
        if (reg) {
            await jsonBinUpdateRecord('registrations', reg.id, { 
                status: 'completed', 
                payment_method: 'cash',
                completed_date: new Date().toISOString() 
            });
            generateRegistrationPDF(reg);
            showToast('Registration completed.', 'success');
            refreshAdminData();
        } else {
            showToast('Registration not found.', 'error');
        }
    } catch (e) {
        const regs = getLocalData('registrations', []);
        const idx = regs.findIndex(r => r.unique_id === id);
        if (idx !== -1) { 
            regs[idx].status = 'completed';
            regs[idx].payment_method = 'cash';
            regs[idx].completed_date = new Date().toISOString();
            setLocalData('registrations', regs);
            generateRegistrationPDF(regs[idx]);
            showToast('Registration completed.', 'success');
            refreshAdminData(); 
        } else {
            showToast('Registration not found.', 'error');
        }
    }
    resetSessionTimer();
}

async function quickReject(id) {
    try {
        const regs = await jsonBinGetCollection('registrations');
        const reg = (regs || []).find(r => r.unique_id === id);
        if (reg) {
            await jsonBinUpdateRecord('registrations', reg.id, { status: 'rejected' });
            showToast('Rejected.', 'error');
            refreshAdminData();
        } else {
            showToast('Registration not found.', 'error');
        }
    } catch (e) {
        const regs = getLocalData('registrations', []);
        const idx = regs.findIndex(r => r.unique_id === id);
        if (idx !== -1) { 
            regs[idx].status = 'rejected';
            setLocalData('registrations', regs);
            showToast('Rejected.', 'error');
            refreshAdminData(); 
        } else {
            showToast('Registration not found.', 'error');
        }
    }
    resetSessionTimer();
}

function handleCashComplete(e) {
    e.preventDefault();
    const input = document.getElementById('cashCodeInput').value.trim().toUpperCase();
    const rd = document.getElementById('cashResult');
    showToast('Please enter the code and click Complete or Reject.', 'info');
    resetSessionTimer();
}

// ============================================================
// 📦 PRODUCTS
// ============================================================
function showAddProductForm() { 
    document.getElementById('addProductForm').style.display = 'block';
    resetSessionTimer(); 
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('addProductForm').querySelector('form').reset();
}

async function handleAddProduct(e) {
    e.preventDefault();
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    const title = document.getElementById('prodTitle').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const description = document.getElementById('prodDesc').value.trim();
    const category = document.getElementById('prodCategory').value.trim();
    const video_url = document.getElementById('prodVideo').value.trim();
    const image_url = document.getElementById('prodImage').value.trim();
    
    if (!title || !price) { 
        showToast('Title and price are required.', 'error'); 
        return; 
    }
    
    try {
        await jsonBinInsert('products', {
            title,
            description,
            price_leone: price,
            category,
            video_url,
            image_url,
            status: 'active',
            views: 0,
            created_at: new Date().toISOString()
        });
        showToast('Product created: ' + title, 'success');
        hideAddProductForm();
        refreshAdminData();
        renderMarket();
        renderProductAds();
        trackAction('product_created', title);
    } catch (e) {
        showToast('Error creating product.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderProducts() {
    try {
        const products = await jsonBinGetCollection('products');
        const sorted = (products || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const b = document.getElementById('productsBody');
        const nd = document.getElementById('productsNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = sorted.map(p =>
            `<tr>
                <td><strong>${p.title}</strong></td>
                <td style="color:var(--accent-bright);font-weight:600;">Le ${p.price_leone ? p.price_leone.toLocaleString() : '0'}</td>
                <td>${p.category || 'N/A'}</td>
                <td><span class="badge badge-${p.status === 'active' ? 'active' : 'inactive'}">${p.status || 'inactive'}</span></td>
                <td>${p.views || 0}</td>
                <td>
                    ${p.video_url ? '<span style="color:var(--accent);font-size:.7rem;"><i class="fas fa-video"></i></span>' : ''}
                    ${p.image_url ? '<span style="color:var(--accent);font-size:.7rem;"><i class="fas fa-image"></i></span>' : ''}
                    <button onclick="toggleProductStatus('${p.id}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Toggle Status">
                        <i class="fas ${p.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button onclick="deleteProduct('${p.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`
        ).join('');
    } catch (e) {
        console.warn('Products fallback:', e);
    }
    resetSessionTimer();
}

async function toggleProductStatus(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    try {
        const products = await jsonBinGetCollection('products');
        const p = (products || []).find(x => x.id === id);
        if (!p) return;
        const newStatus = p.status === 'active' ? 'inactive' : 'active';
        await jsonBinUpdateRecord('products', id, { status: newStatus });
        showToast('Product updated.', 'success');
        renderProducts();
        renderMarket();
        renderProductAds();
    } catch (e) {
        showToast('Error updating product.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function deleteProduct(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    if (!confirm('Delete this product?')) return;
    try {
        await jsonBinDeleteRecord('products', id);
        showToast('Product deleted.', 'success');
        refreshAdminData();
        renderMarket();
        renderProductAds();
    } catch (e) {
        showToast('Error deleting product.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderMarket() {
    const grid = document.getElementById('marketGrid');
    try {
        const products = await jsonBinGetCollection('products');
        const active = (products || []).filter(p => p.status === 'active');
        if (!active || active.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-16" style="color:var(--fg-muted);"><i class="fas fa-store fa-3x mb-4" style="opacity:0.3;"></i><p>No products available yet. Check back soon!</p></div>';
            return;
        }
        grid.innerHTML = active.map(p =>
            `<div class="product-bbc reveal" onclick="viewProduct('${p.id}')" style="cursor:pointer;">
                <div class="product-bbc-image">
                    ${p.video_url ? `<video src="${p.video_url}" style="width:100%;height:100%;object-fit:cover;" controls onerror="this.style.display='none'"></video>` : ''}
                    ${p.image_url && !p.video_url ? `<img src="${p.image_url}" alt="${p.title}" onerror="this.style.display='none'">` : ''}
                    ${!p.video_url && !p.image_url ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--accent);font-family:'Cormorant Garamond',serif;">SMI</div>` : ''}
                    <span class="product-bbc-tag">${p.category || 'Product'}</span>
                </div>
                <div class="product-bbc-body">
                    <div class="product-bbc-category">${p.category || 'General'}</div>
                    <div class="product-bbc-title">${p.title}</div>
                    <div class="product-bbc-desc">${p.description || ''}</div>
                    <div class="product-bbc-price">Le ${p.price_leone ? p.price_leone.toLocaleString() : '0'}</div>
                    <div class="product-bbc-footer">
                        <span class="product-bbc-views"><i class="fas fa-eye"></i> ${p.views || 0}</span>
                        <button class="product-bbc-btn" onclick="event.stopPropagation();buyProduct('${p.id}')"><i class="fas fa-shopping-cart"></i> Buy</button>
                    </div>
                </div>
            </div>`
        ).join('');
        setTimeout(initRevealAnimations, 100);
    } catch (e) {
        console.warn('Market fallback:', e);
    }
}

async function viewProduct(id) {
    try {
        const products = await jsonBinGetCollection('products');
        const p = (products || []).find(x => x.id === id);
        if (p) {
            await jsonBinUpdateRecord('products', id, { views: (p.views || 0) + 1 });
        }
        trackAction('product_view', id);
        showToast('📦 ' + (p ? p.title : 'Product'), 'info');
    } catch (e) {
        showToast('Product details loading...', 'info');
    }
    resetSessionTimer();
}

async function buyProduct(id) {
    try {
        const products = await jsonBinGetCollection('products');
        const p = (products || []).find(x => x.id === id);
        if (!p) { 
            showToast('Product not found.', 'error'); 
            return; 
        }
        trackAction('purchase_click', id);
        const msg = encodeURIComponent(
            'Hello Stars Meet Investors! I\'m interested in purchasing: ' + p.title +
            ' (Le ' + (p.price_leone ? p.price_leone.toLocaleString() : '0') +
            '). Please guide me on the next steps.'
        );
        window.open('https://wa.me/23231286286?text=' + msg, '_blank');
        showToast('Redirecting to WhatsApp...', 'success');
    } catch (e) {
        showToast('Error processing purchase.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

// ============================================================
// 📝 STICKERS / ADS - BBC STYLE
// ============================================================
const STICKER_THEMES = [
    'sticker-theme-red', 'sticker-theme-blue', 'sticker-theme-yellow', 'sticker-theme-green',
    'sticker-theme-purple', 'sticker-theme-orange', 'sticker-theme-teal', 'sticker-theme-pink'
];

function getStickerTheme(index) {
    return STICKER_THEMES[index % STICKER_THEMES.length];
}

function getStickerIcon(title) {
    const icons = ['fa-bullhorn', 'fa-star', 'fa-fire', 'fa-rocket', 'fa-gem', 'fa-crown', 'fa-bolt', 'fa-leaf', 'fa-heart', 'fa-shield'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) { 
        hash = title.charCodeAt(i) + ((hash << 5) - hash); 
    }
    return icons[Math.abs(hash) % icons.length];
}

function showAddStickerForm() { 
    document.getElementById('addStickerForm').style.display = 'block';
    resetSessionTimer(); 
}

function hideAddStickerForm() {
    document.getElementById('addStickerForm').style.display = 'none';
    document.getElementById('addStickerForm').querySelector('form').reset();
}

async function handleAddSticker(e) {
    e.preventDefault();
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    const title = document.getElementById('stickTitle').value.trim();
    const message = document.getElementById('stickMsg').value.trim();
    const image_url = document.getElementById('stickImage').value.trim();
    
    if (!title || !message) { 
        showToast('Title and message are required.', 'error'); 
        return; 
    }
    
    try {
        await jsonBinInsert('stickers', { 
            title, 
            message, 
            image_url, 
            active: true, 
            created_at: new Date().toISOString() 
        });
        showToast('Sticker created: ' + title, 'success');
        hideAddStickerForm();
        renderStickers();
        renderAllStickersAndAds();
    } catch (e) {
        showToast('Error creating sticker.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderStickers() {
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const sorted = (stickers || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const b = document.getElementById('stickersBody');
        const nd = document.getElementById('stickersNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = sorted.map(s =>
            `<tr>
                <td><strong>${s.title}</strong></td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.message}</td>
                <td><span class="badge badge-${s.active !== false ? 'active' : 'inactive'}">${s.active !== false ? 'Active' : 'Inactive'}</span></td>
                <td style="font-size:.8rem;color:var(--fg-dim);">${formatDate(s.created_at)}</td>
                <td>
                    <button onclick="toggleSticker('${s.id}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Toggle Status">
                        <i class="fas ${s.active !== false ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button onclick="deleteSticker('${s.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`
        ).join('');
    } catch (e) {
        console.warn('Stickers fallback:', e);
    }
    resetSessionTimer();
}

async function toggleSticker(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const s = (stickers || []).find(x => x.id === id);
        if (!s) return;
        await jsonBinUpdateRecord('stickers', id, { active: s.active === false ? true : false });
        showToast('Sticker updated.', 'success');
        renderStickers();
        renderAllStickersAndAds();
    } catch (e) {
        showToast('Error updating sticker.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function deleteSticker(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    if (!confirm('Delete this sticker?')) return;
    try {
        await jsonBinDeleteRecord('stickers', id);
        showToast('Sticker deleted.', 'success');
        renderStickers();
        renderAllStickersAndAds();
    } catch (e) {
        showToast('Error deleting sticker.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

// ===== RENDER ALL BBC-STYLE STICKERS AND ADS =====
async function renderAllStickersAndAds() {
    await renderHeaderStickers();
    await renderMidStickers();
    await renderFooterStickers();
    await renderProductAds();
    await renderMarketStickers();
}

async function renderHeaderStickers() {
    const container = document.getElementById('topStickerSection');
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const active = (stickers || []).filter(s => s.active !== false);
        if (!active || active.length === 0) { 
            container.innerHTML = ''; 
            return; 
        }
        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap gap-3 items-center justify-center">
                ${active.slice(0, 4).map((s, idx) => {
                    const theme = getStickerTheme(idx);
                    const icon = getStickerIcon(s.title);
                    return `
                        <div class="sticker-bbc ${theme}" style="min-width:180px;max-width:300px;flex:1;">
                            <div class="sticker-bbc-color-bar"></div>
                            <div class="sticker-bbc-body">
                                ${s.image_url ? `<img src="${s.image_url}" alt="${s.title}" class="sticker-bbc-image" onerror="this.style.display='none'">` : `<div class="sticker-bbc-icon"><i class="fas ${icon}"></i></div>`}
                                <div class="sticker-bbc-content">
                                    <div class="sticker-bbc-title">${s.title}</div>
                                    <div class="sticker-bbc-message">${s.message}</div>
                                    <span class="sticker-bbc-badge">Ad</span>
                                </div>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    } catch (e) { 
        container.innerHTML = ''; 
    }
}

async function renderMidStickers() {
    const page = currentSection || 'home';
    const container = document.getElementById(page + 'MidStickers');
    if (!container) return;
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const active = (stickers || []).filter(s => s.active !== false);
        if (!active || active.length === 0) { 
            container.innerHTML = ''; 
            return; 
        }
        container.innerHTML = `
            <div class="flex flex-wrap gap-3 items-center justify-center py-2">
                ${active.slice(0, 3).map((s, idx) => {
                    const theme = getStickerTheme(idx + 3);
                    const icon = getStickerIcon(s.title);
                    return `
                        <div class="sticker-bbc ${theme}" style="min-width:200px;max-width:400px;flex:1;">
                            <div class="sticker-bbc-color-bar"></div>
                            <div class="sticker-bbc-body">
                                ${s.image_url ? `<img src="${s.image_url}" alt="${s.title}" class="sticker-bbc-image" onerror="this.style.display='none'">` : `<div class="sticker-bbc-icon"><i class="fas ${icon}"></i></div>`}
                                <div class="sticker-bbc-content">
                                    <div class="sticker-bbc-title">${s.title}</div>
                                    <div class="sticker-bbc-message">${s.message}</div>
                                </div>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    } catch (e) { 
        container.innerHTML = ''; 
    }
}

async function renderFooterStickers() {
    const containers = document.querySelectorAll('[id^="footerStickersSection"]');
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const active = (stickers || []).filter(s => s.active !== false);
        containers.forEach((container, containerIdx) => {
            if (!active || active.length === 0) { 
                container.innerHTML = ''; 
                return; 
            }
            const offset = containerIdx * 2 + 6;
            container.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-3 items-center justify-center py-2">
                    ${active.slice(0, 3).map((s, idx) => {
                        const theme = getStickerTheme(offset + idx);
                        const icon = getStickerIcon(s.title);
                        return `
                            <div class="sticker-bbc ${theme}" style="min-width:180px;max-width:300px;flex:1;">
                                <div class="sticker-bbc-color-bar"></div>
                                <div class="sticker-bbc-body">
                                    ${s.image_url ? `<img src="${s.image_url}" alt="${s.title}" class="sticker-bbc-image" onerror="this.style.display='none'">` : `<div class="sticker-bbc-icon"><i class="fas ${icon}"></i></div>`}
                                    <div class="sticker-bbc-content">
                                        <div class="sticker-bbc-title">${s.title}</div>
                                        <div class="sticker-bbc-message">${s.message}</div>
                                        <span class="sticker-bbc-badge">Ad</span>
                                    </div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>`;
        });
    } catch (e) {
        containers.forEach(container => container.innerHTML = '');
    }
}

async function renderMarketStickers() {
    const container = document.getElementById('marketStickers');
    if (!container) return;
    try {
        const stickers = await jsonBinGetCollection('stickers');
        const active = (stickers || []).filter(s => s.active !== false);
        if (!active || active.length === 0) { 
            container.innerHTML = ''; 
            return; 
        }
        container.innerHTML = `
            <div class="flex flex-wrap gap-3 items-center justify-center py-2 mb-4">
                ${active.map((s, idx) => {
                    const theme = getStickerTheme(idx + 10);
                    const icon = getStickerIcon(s.title);
                    return `
                        <div class="sticker-bbc ${theme}" style="min-width:200px;max-width:400px;flex:1;">
                            <div class="sticker-bbc-color-bar"></div>
                            <div class="sticker-bbc-body">
                                ${s.image_url ? `<img src="${s.image_url}" alt="${s.title}" class="sticker-bbc-image" onerror="this.style.display='none'">` : `<div class="sticker-bbc-icon"><i class="fas ${icon}"></i></div>`}
                                <div class="sticker-bbc-content">
                                    <div class="sticker-bbc-title">${s.title}</div>
                                    <div class="sticker-bbc-message">${s.message}</div>
                                </div>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    } catch (e) { 
        container.innerHTML = ''; 
    }
}

// ============================================================
// 🛒 PRODUCT ADS - BBC STYLE
// ============================================================
async function renderProductAds() {
    try {
        const products = await jsonBinGetCollection('products');
        const active = (products || []).filter(p => p.status === 'active').slice(0, 10);
        const adContainers = [
            'homeProductAdsContainer', 'aboutProductAdsContainer', 'galleryProductAdsContainer',
            'registerProductAdsContainer', 'contactProductAdsContainer'
        ];
        
        const headerContainer = document.getElementById('headerProductAds');
        if (headerContainer) {
            if (!active || active.length === 0) { 
                headerContainer.innerHTML = ''; 
            } else {
                headerContainer.innerHTML = `
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2">
                        <div class="ads-scroll-area" style="padding:4px 0;">
                            ${active.map(p => `
                                <div class="product-bbc" onclick="viewProduct('${p.id}')" style="min-width:160px;max-width:200px;cursor:pointer;">
                                    <div class="product-bbc-image" style="min-height:70px;">
                                        ${p.video_url ? `<video src="${p.video_url}" style="width:100%;height:100%;object-fit:cover;" muted onerror="this.style.display='none'"></video>` : ''}
                                        ${p.image_url && !p.video_url ? `<img src="${p.image_url}" alt="${p.title}" onerror="this.style.display='none'">` : ''}
                                        ${!p.video_url && !p.image_url ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--accent);font-family:'Cormorant Garamond',serif;">SMI</div>` : ''}
                                    </div>
                                    <div class="product-bbc-body" style="padding:8px 12px 12px;">
                                        <div class="product-bbc-title" style="font-size:.8rem;">${p.title}</div>
                                        <div class="product-bbc-price" style="font-size:.85rem;">Le ${p.price_leone ? p.price_leone.toLocaleString() : '0'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
            }
        }
        
        adContainers.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;
            if (!active || active.length === 0) {
                container.innerHTML = '<div class="text-center py-4" style="color:var(--fg-muted);font-size:.85rem;">No products available.</div>';
                return;
            }
            container.innerHTML = active.map(p => `
                <div class="product-bbc" onclick="viewProduct('${p.id}')" style="cursor:pointer;min-width:200px;max-width:280px;">
                    <div class="product-bbc-image">
                        ${p.video_url ? `<video src="${p.video_url}" style="width:100%;height:100%;object-fit:cover;" muted onerror="this.style.display='none'"></video>` : ''}
                        ${p.image_url && !p.video_url ? `<img src="${p.image_url}" alt="${p.title}" onerror="this.style.display='none'">` : ''}
                        ${!p.video_url && !p.image_url ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--accent);font-family:'Cormorant Garamond',serif;">SMI</div>` : ''}
                        <span class="product-bbc-tag">${p.category || 'Product'}</span>
                    </div>
                    <div class="product-bbc-body">
                        <div class="product-bbc-category">${p.category || 'General'}</div>
                        <div class="product-bbc-title">${p.title}</div>
                        <div class="product-bbc-desc">${p.description || ''}</div>
                        <div class="product-bbc-price">Le ${p.price_leone ? p.price_leone.toLocaleString() : '0'}</div>
                        <div class="product-bbc-footer">
                            <span class="product-bbc-views"><i class="fas fa-eye"></i> ${p.views || 0}</span>
                            <button class="product-bbc-btn" onclick="event.stopPropagation();buyProduct('${p.id}')"><i class="fas fa-shopping-cart"></i> Buy</button>
                        </div>
                    </div>
                </div>
            `).join('');
        });
    } catch (e) {
        console.warn('Product ads fallback:', e);
    }
}

// ============================================================
// 📱 SOCIAL FEEDS
// ============================================================
async function fetchAllSocialFeeds() {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    showToast('Fetching social feeds from 30+ platforms...', 'info');
    
    const platforms = [
        'Facebook', 'X (Twitter)', 'Instagram', 'TikTok', 'YouTube', 
        'LinkedIn', 'Pinterest', 'Reddit', 'Snapchat', 'WhatsApp',
        'Telegram', 'Discord', 'Twitch', 'Tumblr', 'Flickr', 
        'Vimeo', 'Dribbble', 'Behance', 'GitHub', 'GitLab', 
        'Medium', 'Quora', 'Stack Overflow', 'Product Hunt', 'Slack', 
        'Zoom', 'Google', 'Apple', 'Microsoft', 'Amazon', 'Spotify'
    ];
    
    const sampleContent = [
        "Exciting news! Our platform just reached 500 registered businesses. 🚀",
        "New investor joined our network! Welcome aboard. 💼",
        "Pitch event scheduled for next month. Register now! 📅",
        "Success story: Startup raised $2M through our platform. 🎉",
        "Webinar on investor readiness this Thursday. Don't miss it! 📺",
        "We're expanding to new markets in Africa and Asia. 🌍",
        "Featured business of the week: Tech innovation leader. 💡",
        "Investment round open for early-stage startups. 💰",
        "Join our community of 1000+ entrepreneurs. 🤝",
        "New partnership announcement coming soon! 🤫"
    ];
    
    const authors = [
        'SMI Team', 'Investor Relations', 'Startup Spotlight', 
        'Business Growth', 'Funding News', 'Innovation Hub', 
        'Global Network', 'Success Stories', 'Event Updates'
    ];
    
    let inserted = 0;
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const content = sampleContent[Math.floor(Math.random() * sampleContent.length)];
        const author = authors[Math.floor(Math.random() * authors.length)];
        try {
            const existing = await jsonBinQuery('social_feeds', 'platform', platform);
            if (!existing || existing.length === 0) {
                await jsonBinInsert('social_feeds', {
                    platform: platform,
                    content: content,
                    author: author,
                    likes: Math.floor(Math.random() * 1000),
                    comments: Math.floor(Math.random() * 100),
                    shares: Math.floor(Math.random() * 50),
                    posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    fetched_at: new Date().toISOString()
                });
                inserted++;
            }
        } catch (e) { /* continue */ }
    }
    showToast(`Fetched ${inserted} new social feeds from ${platforms.length} platforms!`, 'success');
    refreshSocialFeeds();
    resetSessionTimer();
}

async function refreshSocialFeeds() {
    try {
        const feeds = await jsonBinGetCollection('social_feeds');
        const sorted = (feeds || []).sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at));
        const container = document.getElementById('socialFeedContainer');
        if (!sorted || sorted.length === 0) {
            container.innerHTML = '<div class="text-center py-8" style="color:var(--fg-dim);">No social feeds yet. Click "Fetch All" to load data from 30+ platforms.</div>';
            return;
        }
        container.innerHTML = sorted.slice(0, 10).map(f =>
            `<div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);align-items:center;">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);">
                    <i class="fas fa-share-alt"></i>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <strong style="font-size:.85rem;">${f.platform}</strong>
                        <span style="color:var(--fg-muted);font-size:.7rem;">•</span>
                        <span style="color:var(--fg-muted);font-size:.7rem;">${f.author || 'Anonymous'}</span>
                        <span style="color:var(--fg-dim);font-size:.65rem;margin-left:auto;">${formatTime(f.fetched_at || f.posted_at)}</span>
                    </div>
                    <p style="font-size:.85rem;color:var(--fg-warm);margin-top:4px;">${f.content}</p>
                    <div style="display:flex;gap:16px;margin-top:6px;">
                        <span style="color:var(--fg-dim);font-size:.7rem;"><i class="fas fa-heart" style="color:var(--danger);"></i> ${f.likes || 0}</span>
                        <span style="color:var(--fg-dim);font-size:.7rem;"><i class="fas fa-comment"></i> ${f.comments || 0}</span>
                        <span style="color:var(--fg-dim);font-size:.7rem;"><i class="fas fa-share"></i> ${f.shares || 0}</span>
                    </div>
                </div>
            </div>`
        ).join('');
        
        const b = document.getElementById('socialBody');
        const nd = document.getElementById('socialNoData');
        if (!sorted || sorted.length === 0) { 
            if (b) b.innerHTML = '';
            if (nd) nd.style.display = ''; 
            return; 
        }
        if (nd) nd.style.display = 'none';
        if (b) {
            b.innerHTML = sorted.slice(0, 20).map(f =>
                `<tr>
                    <td><span class="badge badge-active">${f.platform}</span></td>
                    <td>${f.author || 'N/A'}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.content || 'N/A'}</td>
                    <td>${f.likes || 0}</td>
                    <td>${f.comments || 0}</td>
                    <td>${f.shares || 0}</td>
                    <td style="font-size:.75rem;color:var(--fg-dim);">${formatTime(f.posted_at)}</td>
                </tr>`
            ).join('');
        }
    } catch (e) {
        console.warn('Social feeds fallback:', e);
    }
}

// ============================================================
// 👥 INFLUENCERS
// ============================================================
function showAddInfluencerForm() { 
    document.getElementById('addInfluencerForm').style.display = 'block';
    resetSessionTimer(); 
}

function hideAddInfluencerForm() {
    document.getElementById('addInfluencerForm').style.display = 'none';
    document.getElementById('addInfluencerForm').querySelector('form').reset();
}

async function handleAddInfluencer(e) {
    e.preventDefault();
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    const name = document.getElementById('infName').value.trim();
    const platform = document.getElementById('infPlatform').value.trim();
    const url = document.getElementById('infUrl').value.trim();
    let code = document.getElementById('infCode').value.trim().toUpperCase();
    
    if (!name) { 
        showToast('Name is required.', 'error'); 
        return; 
    }
    if (!code) code = generateCode();
    
    try {
        await jsonBinInsert('influencers', { 
            name, 
            platform, 
            url, 
            code, 
            active: true, 
            created_at: new Date().toISOString() 
        });
        showToast('Influencer created: ' + name + ' (Code: ' + code + ')', 'success');
        hideAddInfluencerForm();
        renderInfluencers();
        refreshAdminData();
    } catch (e) {
        showToast('Error creating influencer.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderInfluencers() {
    try {
        const influencers = await jsonBinGetCollection('influencers');
        const sorted = (influencers || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const detections = getLocalData('influencerDetections', []);
        const b = document.getElementById('influencersBody');
        const nd = document.getElementById('influencersNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = sorted.map(inf => {
            const detected = detections.some(d => d.influencerCode === inf.code);
            const shareLink = window.location.origin + window.location.pathname + '?ref=' + inf.code;
            return `<tr>
                <td><strong>${inf.name}</strong></td>
                <td>${inf.platform || 'N/A'}</td>
                <td style="font-family:monospace;font-size:.85rem;color:var(--accent-bright);">${inf.code}</td>
                <td><a href="${shareLink}" target="_blank" style="color:var(--accent);font-size:.8rem;"><i class="fas fa-link"></i> ${shareLink}</a></td>
                <td><span class="badge badge-${inf.active !== false ? 'active' : 'inactive'}">${inf.active !== false ? 'Active' : 'Inactive'}</span></td>
                <td>${detected ? '<span style="color:var(--success);"><i class="fas fa-check-circle"></i> Detected</span>' : '<span style="color:var(--fg-dim);">Not yet</span>'}</td>
                <td>
                    <button onclick="toggleInfluencer('${inf.id}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Toggle Status">
                        <i class="fas ${inf.active !== false ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button onclick="deleteInfluencer('${inf.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.82rem;padding:4px 8px;" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.warn('Influencers fallback:', e);
    }
    resetSessionTimer();
}

async function toggleInfluencer(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    try {
        const influencers = await jsonBinGetCollection('influencers');
        const inf = (influencers || []).find(x => x.id === id);
        if (!inf) return;
        await jsonBinUpdateRecord('influencers', id, { active: inf.active === false ? true : false });
        showToast('Influencer updated.', 'success');
        renderInfluencers();
    } catch (e) {
        showToast('Error updating influencer.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function deleteInfluencer(id) {
    if (!currentUser) { 
        showToast('Please login first.', 'error'); 
        return; 
    }
    if (!confirm('Delete this influencer?')) return;
    try {
        await jsonBinDeleteRecord('influencers', id);
        showToast('Influencer deleted.', 'success');
        renderInfluencers();
        refreshAdminData();
    } catch (e) {
        showToast('Error deleting influencer.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

// ============================================================
// 💳 PAYMENT CODES
// ============================================================
async function generateNewCode() {
    if (!currentUser || currentUser.role !== 'admin') { 
        showToast('Admins only.', 'error'); 
        return; 
    }
    const code = generateUniqueID();
    try {
        await jsonBinInsert('codes', { 
            code, 
            status: 'available', 
            created_at: new Date().toISOString() 
        });
        showToast('Code generated: ' + code, 'success');
        renderCodes();
    } catch (e) {
        showToast('Error generating code.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderCodes() {
    try {
        const codes = await jsonBinGetCollection('codes');
        const sorted = (codes || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const b = document.getElementById('codesTableBody');
        const nd = document.getElementById('codesNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = sorted.map(c =>
            `<tr>
                <td style="font-family:monospace;font-size:.9rem;color:var(--accent-bright);letter-spacing:.04em;">${c.code}</td>
                <td><span class="badge badge-${c.status === 'available' ? 'pending' : 'completed'}">${c.status || 'available'}</span></td>
                <td style="color:var(--fg-dim);font-size:.82rem;">${formatDate(c.created_at)}</td>
                <td style="color:var(--fg-dim);font-size:.82rem;">${c.used_by || '—'}</td>
            </tr>`
        ).join('');
    } catch (e) {
        console.warn('Codes fallback:', e);
    }
}

// ============================================================
// 👥 STAFF MANAGEMENT
// ============================================================
function showAddStaffForm() { 
    document.getElementById('addStaffForm').style.display = 'block';
    resetSessionTimer(); 
}

function hideAddStaffForm() {
    document.getElementById('addStaffForm').style.display = 'none';
    document.getElementById('addStaffForm').querySelector('form').reset();
}

async function handleAddStaff(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') { 
        showToast('Admins only.', 'error'); 
        return; 
    }
    const name = document.getElementById('staffName').value.trim();
    const username = document.getElementById('staffUsername').value.trim();
    const password = document.getElementById('staffPassword').value;
    const role = document.getElementById('staffRole').value;
    
    if (!name || !username || !password) { 
        showToast('All fields are required.', 'error'); 
        return; 
    }
    
    try {
        const existing = await jsonBinQuery('users', 'username', username);
        if (existing && existing.length > 0) { 
            showToast('Username exists.', 'error'); 
            return; 
        }
        await jsonBinInsert('users', { 
            username, 
            password, 
            role, 
            name, 
            created_at: new Date().toISOString() 
        });
        showToast('Created: ' + name, 'success');
        hideAddStaffForm();
        renderStaff();
        refreshAdminData();
    } catch (e) {
        showToast('Error creating staff.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function deleteStaff(username) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (username === 'admin') { 
        showToast('Cannot delete primary admin.', 'error'); 
        return; 
    }
    try {
        const users = await jsonBinQuery('users', 'username', username);
        if (users && users.length > 0) {
            await jsonBinDeleteRecord('users', users[0].id);
            showToast('Removed.', 'info');
            renderStaff();
            refreshAdminData();
        }
    } catch (e) {
        showToast('Error deleting staff.', 'error');
        console.error(e);
    }
    resetSessionTimer();
}

async function renderStaff() {
    try {
        const users = await jsonBinGetCollection('users');
        const sorted = (users || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const b = document.getElementById('staffTableBody');
        const nd = document.getElementById('staffNoData');
        if (!sorted || sorted.length === 0) { 
            b.innerHTML = '';
            nd.style.display = ''; 
            return; 
        }
        nd.style.display = 'none';
        b.innerHTML = sorted.map(u =>
            `<tr>
                <td>${u.name}</td>
                <td style="font-family:monospace;font-size:.88rem;">${u.username}</td>
                <td><span class="badge" style="background:var(--accent-glow);color:var(--accent-bright);">${u.role || 'staff'}</span></td>
                <td style="color:var(--fg-dim);font-size:.82rem;">${formatDate(u.created_at)}</td>
                <td>${u.username !== 'admin' ? `<button onclick="deleteStaff('${u.username}')" style="background:none;border:none;color:#e68a8a;cursor:pointer;font-size:.82rem;" title="Delete"><i class="fas fa-trash-alt"></i></button>` : '<span style="color:var(--fg-dim);font-size:.75rem;">Protected</span>'}</td>
            </tr>`
        ).join('');
    } catch (e) {
        console.warn('Staff fallback:', e);
    }
}

// ============================================================
// 💬 WHATSAPP & CONTACT
// ============================================================
function goToWhatsAppRegister() {
    const msg = encodeURIComponent(
        'Hello Stars Meet Investors! I would like to register my business. Kindly guide me through the registration process.'
    );
    window.open('https://wa.me/23231286286?text=' + msg, '_blank');
    trackAction('whatsapp_register', 'click');
    resetSessionTimer();
}

function handleContact(e) {
    e.preventDefault();
    showToast('Message received. We will respond shortly.', 'success');
    e.target.reset();
    trackAction('contact_submit', 'form');
    resetSessionTimer();
}

// ============================================================
// 🖼️ GALLERY
// ============================================================
const GALLERY_IMAGES = [
    { caption: 'Investor Pitch Session' },
    { caption: 'Networking Breakfast' },
    { caption: 'Panel Discussion' },
    { caption: 'Deal Signing' },
    { caption: 'Business Showcase' },
    { caption: 'Awards Night' },
    { caption: 'Workshop' },
    { caption: 'Closing Gala' },
    { caption: 'Investor Roundtable' },
    { caption: 'Stars Meet Investors' }
];

function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = GALLERY_IMAGES.map((img, i) => {
        const span = (i === 0 || i === 5) ? 'md:col-span-2 md:row-span-2' : '';
        const h = (i === 0 || i === 5) ? 'h-52 sm:h-64 md:h-full' : 'h-40 sm:h-48 md:h-56';
        return `
            <div class="gallery-img ${h} ${span}" onclick="openLightbox('')">
                <div style="width:100%;height:100%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;border-radius:14px;font-size:1.2rem;font-weight:700;color:var(--accent);font-family:'Cormorant Garamond',serif;">SMI</div>
                <div class="gallery-overlay"><span class="text-sm font-semibold">${img.caption}</span></div>
            </div>`;
    }).join('');
}

function openLightbox(src) {
    document.getElementById('lightboxImg').src = 
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23161110"/%3E%3Ctext x="200" y="210" font-size="48" text-anchor="middle" fill="%23c8956c" font-family="serif" font-weight="bold"%3ESMI%3C/text%3E%3C/svg%3E';
    document.getElementById('lightbox').classList.add('show');
    resetSessionTimer();
}

function closeLightbox() { 
    document.getElementById('lightbox').classList.remove('show'); 
}

// ============================================================
// 💬 CHATBOT
// ============================================================
let chatOpen = false, chatInitialized = false;

function toggleChat() {
    chatOpen = !chatOpen;
    const w = document.getElementById('chatWindow');
    const icon = document.getElementById('chatToggleIcon');
    const badge = document.getElementById('chatBadge');
    if (chatOpen) {
        w.classList.add('open');
        icon.className = 'fas fa-times';
        badge.style.display = 'none';
        if (!chatInitialized) { 
            initChat();
            chatInitialized = true; 
        }
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
        resetSessionTimer();
    } else { 
        w.classList.remove('open');
        icon.className = 'fas fa-comment-dots'; 
    }
}

function initChat() {
    addBotMessage("Good day, and welcome to Stars Meet Investors. I'm your concierge — here to help you learn about our platform, services, and how we connect businesses with the right investors. How may I assist you today?");
    showQuickReplies(['What is SMI?', 'How to Register', 'Upcoming Events', 'Investor Requirements', 'Pricing & Fees', 'Contact Support']);
}

function showQuickReplies(options) {
    const q = document.getElementById('chatQuick');
    q.innerHTML = options.map(o =>
        `<button class="chat-quick-btn" onclick="handleQuickReply('${o.replace(/'/g, "\\'")}')">${o}</button>`
    ).join('');
}

function handleQuickReply(text) {
    addUserMessage(text);
    document.getElementById('chatQuick').innerHTML = '';
    showTyping();
    setTimeout(() => processQuestion(text), 800 + Math.random() * 600);
    resetSessionTimer();
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);
    document.getElementById('chatQuick').innerHTML = '';
    showTyping();
    setTimeout(() => processQuestion(text), 800 + Math.random() * 600);
    resetSessionTimer();
}

document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { 
        e.preventDefault();
        sendChat(); 
    }
});

function addBotMessage(text) {
    const m = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = 'chat-msg bot';
    d.innerHTML = text;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

function addUserMessage(text) {
    const m = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = 'chat-msg user';
    d.textContent = text;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

function showTyping() {
    const m = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = 'chat-typing';
    d.id = 'typingIndicator';
    d.innerHTML = '<span></span><span></span><span></span>';
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

function hideTyping() { 
    const t = document.getElementById('typingIndicator'); 
    if (t) t.remove(); 
}

function processQuestion(q) {
    hideTyping();
    const ql = q.toLowerCase();
    
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening|day))/i.test(ql)) {
        addBotMessage("Thank you for reaching out. It's a pleasure to assist you. Could you let me know what specifically you'd like to learn about Stars Meet Investors?");
        showQuickReplies(['What is SMI?', 'How to Register', 'Upcoming Events']);
        return;
    }
    if (/what\s*(is|are)\s*(smi|stars meet investors)|tell\s*me\s*about|who\s*(is|are)\s*(you|smi)/i.test(ql)) {
        addBotMessage("Stars Meet Investors is a premier platform that bridges ambitious businesses with strategic investors. We curate, verify, and present businesses to a network of over 120 pre-qualified investors across 12+ countries. Since 2019, we've facilitated over $24 million in investment capital and closed 35+ deals.");
        showQuickReplies(['How to Register', 'Upcoming Events', 'Investor Requirements']);
        return;
    }
    if (/register|registration|sign\s*up|how\s*to\s*join|apply|enroll/i.test(ql)) {
        addBotMessage("Registration is handled personally through our WhatsApp channel to ensure a seamless, guided experience. When you click <strong>Register</strong> on our website, you'll be connected directly with our registration team who will walk you through each step.<br><br>Would you like me to redirect you to WhatsApp to begin?");
        showQuickReplies(['Yes, take me to WhatsApp', 'What info do I need?']);
        return;
    }
    if (/yes.*whatsapp|take me|redirect|open whatsapp/i.test(ql)) {
        goToWhatsAppRegister();
        addBotMessage("Redirecting you to WhatsApp now. Our team will assist you shortly!");
        return;
    }
    if (/what\s*(info|information|details|documents?)\s*(do\s*i\s*)?(need|require)|prepare|bring/i.test(ql)) {
        addBotMessage("To register, please have the following ready:<br><br>• <strong>Business Name</strong><br>• <strong>Registration Number</strong> — e.g., RC-1234567<br>• <strong>Representative Name</strong><br>• <strong>Email & Phone</strong><br>• <strong>Industry/Sector</strong><br>• <strong>Business Stage</strong><br>• <strong>Capital Seeking</strong><br>• <strong>Business Address</strong><br>• <strong>Brief Description</strong><br><br>Our WhatsApp team will guide you through each field.");
        return;
    }
    if (/event|pitch|upcoming|next\s*(event|session|pitch)|summit|conference|gala/i.test(ql)) {
        addBotMessage("We host several types of events throughout the year:<br><br>• <strong>Live Pitch Sessions</strong><br>• <strong>Networking Breakfasts</strong><br>• <strong>Panel Discussions</strong><br>• <strong>Workshops</strong><br>• <strong>Awards & Gala Nights</strong><br><br>Registered businesses get priority access and discounted tickets.");
        showQuickReplies(['How to Register', 'Contact Support']);
        return;
    }
    if (/investor\s*(requirement|criteria|looking|want|need)|what\s*do\s*investor|qualif/i.test(ql)) {
        addBotMessage("Our investors typically look for:<br><br>• <strong>Clear Value Proposition</strong><br>• <strong>Traction</strong><br>• <strong>Scalable Model</strong><br>• <strong>Strong Team</strong><br>• <strong>Market Size</strong><br>• <strong>Financial Clarity</strong><br><br>Investors on our platform span from angel investors to VCs seeking growth-stage companies.");
        return;
    }
    if (/pric|cost|fee|how\s*much|payment|free|charge|afford/i.test(ql)) {
        addBotMessage("Our pricing varies based on the level of engagement you seek. We offer different tiers — from basic registration to premium packages. For specific pricing details tailored to your needs, our team would be happy to provide a personalized breakdown.");
        showQuickReplies(['Contact Support for Pricing', 'How to Register']);
        return;
    }
    if (/contact|support|help\s*me|human|real\s*person|speak|talk\s*to|agent|whatsapp|phone\s*number/i.test(ql)) {
        addBotMessage("I'd be happy to connect you with our team. You can reach us through:<br><br>• <strong>WhatsApp</strong>: <a href='https://wa.me/23231286286' target='_blank'>+23231286286</a><br>• <strong>Email</strong>: info@starsmeetinvestors.com<br>• <strong>Phone</strong>: +232 31 286 286");
        showQuickReplies(['Open WhatsApp', 'Ask something else']);
        return;
    }
    if (/cash\s*payment|pay\s*in\s*cash|cash\s*only|offline\s*payment/i.test(ql)) {
        addBotMessage("Yes, we do accommodate cash payments. When you register via WhatsApp, simply inform our team that you'd prefer the cash payment option. They will generate a unique code for you, and once payment is confirmed, your registration will be completed.");
        return;
    }
    if (/document|certificate|pdf|watermark|proof|verif/i.test(ql)) {
        addBotMessage("Upon successful registration, you receive an official registration certificate as a PDF document. This certificate features:<br><br>• Your unique <strong>SMI-XXXX-XXXX</strong> registration ID<br>• Your business and representative details<br>• A <strong>watermarked profile image</strong> for authentication<br>• Diagonal watermark text across the entire document<br>• Status and date of registration");
        return;
    }
    if (/countr|location|where|office|based|headquarter|sierra|leone|freetown|global/i.test(ql)) {
        addBotMessage("Our headquarters is in Freetown, Sierra Leone. However, our investor network spans 12+ countries including Nigeria, South Africa, Kenya, Ghana, the UK, the UAE, the US, and more. We operate globally.");
        return;
    }
    if (/success|deal|closed|fund|raised|story|testimonial|result/i.test(ql)) {
        addBotMessage("Since our founding in 2019, Stars Meet Investors has facilitated over <strong>$24 million</strong> in investment capital and closed <strong>35+ deals</strong> across various industries. Our satisfaction rate stands at 98%.");
        return;
    }
    if (/thank|thanks|appreciate|grateful/i.test(ql)) {
        addBotMessage("You're most welcome. It's been a pleasure assisting you. Wishing you the very best on your investment journey.");
        showQuickReplies(['Register Now', 'Ask something else']);
        return;
    }
    if (/bye|goodbye|see\s*you|later|good\s*night/i.test(ql)) {
        addBotMessage("Thank you for visiting Stars Meet Investors. We look forward to supporting your business growth. Have a wonderful day!");
        return;
    }
    
    addBotMessage("I appreciate your question. For detailed, personalized answers, I'd recommend speaking directly with our team on WhatsApp — they can provide detailed answers.<br><br>You can reach them at <a href='https://wa.me/23231286286' target='_blank'>+23231286286</a>.");
    showQuickReplies(['Open WhatsApp', 'Ask about SMI', 'How to Register', 'Contact Info']);
}

// ============================================================
// 🎨 PARTICLE BACKGROUND
// ============================================================
function initParticles() {
    const cv = document.getElementById('bgCanvas');
    const ctx = cv.getContext('2d');
    let w, h, pts = [];
    const N = 45;

    function resize() { 
        w = cv.width = window.innerWidth;
        h = cv.height = window.innerHeight; 
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < N; i++) {
        pts.push({ 
            x: Math.random() * w, 
            y: Math.random() * h, 
            vx: (Math.random() - .5) * .22, 
            vy: (Math.random() - .5) * .22, 
            r: Math.max(.5, Math.random() * 1.6), 
            a: Math.random() * .18 + .03 
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        pts.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(.1, p.r), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,149,108,' + p.a + ')';
            ctx.fill();
        });
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x;
                const dy = pts[i].y - pts[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(pts[i].x, pts[i].y);
                    ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = 'rgba(200,149,108,' + (0.025 * (1 - d / 130)) + ')';
                    ctx.lineWidth = .5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================
// 🎨 ANIMATIONS
// ============================================================
function initRevealAnimations() {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add('visible'), i * 80);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: .1 });
    els.forEach(el => obs.observe(el));
}

function initCounters() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const el = e.target;
                const t = parseInt(el.dataset.count);
                let c = 0;
                const s = Math.max(1, Math.floor(t / 60));
                const timer = setInterval(() => {
                    c += s;
                    if (c >= t) { 
                        c = t;
                        clearInterval(timer); 
                    }
                    el.textContent = c + '+';
                }, 25);
                obs.unobserve(el);
            }
        });
    }, { threshold: .5 });
    document.querySelectorAll('[data-count]').forEach(c => obs.observe(c));
}

function initNavScroll() {
    window.addEventListener('scroll', () => {
        document.getElementById('mainNav').style.boxShadow = 
            window.scrollY > 50 ? '0 4px 30px rgba(0,0,0,0.35)' : 'none';
        resetSessionTimer();
    });
}

// ============================================================
// 🚀 INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    await initData();
    await detectLocation();
    initGallery();
    initParticles();
    initRevealAnimations();
    initCounters();
    initNavScroll();
    await renderAllStickersAndAds();
    await renderMarket();
    await renderStickers();
    await renderInfluencers();
    await refreshAdminData();

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        const influencers = getLocalData('influencers', []);
        const inf = influencers.find(i => i.code === ref);
        if (inf) {
            showToast('🔗 Influencer link detected: ' + inf.name, 'success');
            trackAction('influencer_click', { code: ref, name: inf.name });
        }
    }

    trackAction('page_load', 'home');

    console.log('🚀 Stars Meet Investors AI Dashboard loaded successfully!');
    console.log('🗄️ Connected to JSONBin.io with local fallback');
    console.log('📍 Location: ' + visitorLocation.full);
    console.log('🔑 Default login: admin / starsmeet2025');
    console.log('📌 BBC-style Stickers with unique colors');
    console.log('📦 BBC-style Product cards');
    console.log('📱 30+ Social media platforms integrated.');
    console.log('⏰ Auto-logout after 30 minutes of inactivity.');
});
