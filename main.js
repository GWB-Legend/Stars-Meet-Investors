// ============================================================
// 🔗 SUPABASE CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://gavohnyplnwuuffshyuu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhdm9obnlwbG53dXVmZnNoeXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzI0NzgsImV4cCI6MjEwMjEwODQ3OH0.ggjb1Dkv_KOLDXbDoUl5GCKW8NYVNuy7Z3Dryc-xa2E';

// Initialize Supabase client
let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected');
} catch (e) {
    console.error('❌ Supabase connection failed:', e);
}

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
// 🗄️ SUPABASE CRUD HELPERS
// ============================================================
async function supabaseGet(table, select = '*', orderBy = null, orderDir = 'asc') {
    if (!supabaseClient) return getLocalData(table, []);
    try {
        let query = supabaseClient.from(table).select(select);
        if (orderBy) query = query.order(orderBy, { ascending: orderDir === 'asc' });
        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Supabase get error:', e);
        return getLocalData(table, []);
    }
}

async function supabaseInsert(table, record) {
    if (!supabaseClient) throw new Error('Supabase not connected');
    try {
        const { data, error } = await supabaseClient.from(table).insert(record).select();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Supabase insert error:', e);
        const local = getLocalData(table, []);
        local.push({ ...record, id: 'local_' + Date.now() });
        setLocalData(table, local);
        return [record];
    }
}

async function supabaseUpdate(table, id, updates) {
    if (!supabaseClient) throw new Error('Supabase not connected');
    try {
        const { data, error } = await supabaseClient.from(table).update(updates).eq('id', id).select();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Supabase update error:', e);
        const local = getLocalData(table, []);
        const idx = local.findIndex(item => item.id === id);
        if (idx !== -1) {
            local[idx] = { ...local[idx], ...updates };
            setLocalData(table, local);
        }
        return [local[idx]];
    }
}

async function supabaseDelete(table, id) {
    if (!supabaseClient) throw new Error('Supabase not connected');
    try {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase delete error:', e);
        const local = getLocalData(table, []);
        setLocalData(table, local.filter(item => item.id !== id));
        return false;
    }
}

async function supabaseQuery(table, column, value) {
    if (!supabaseClient) return getLocalData(table, []).filter(item => item[column] === value);
    try {
        const { data, error } = await supabaseClient.from(table).select('*').eq(column, value);
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Supabase query error:', e);
        const local = getLocalData(table, []);
        return local.filter(item => item[column] === value);
    }
}


// ============================================================
// 🔎 CONNECTION TEST (shows the REAL Supabase error on screen)
// ============================================================
async function testSupabaseConnection() {
    if (!supabaseClient) {
        showToast('Supabase library failed to load. Check internet connection.', 'error');
        return false;
    }
    const { error } = await supabaseClient.from('users').select('id').limit(1);
    if (error) {
        console.error('❌ Supabase test failed:', error);
        showToast('Database error: ' + error.message, 'error');
        return false;
    }
    console.log('✅ Supabase "users" table reachable');
    return true;
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
        const products = await supabaseGet('products', 'id');
        if (!products || products.length === 0) {
            for (const p of DEFAULT_PRODUCTS) {
                await supabaseInsert('products', p);
            }
            console.log('📦 Default products seeded.');
        }

        const users = await supabaseQuery('users', 'username', 'admin');
        if (!users || users.length === 0) {
            await supabaseInsert('users', {
                username: 'admin',
                password: 'starsmeet2025',
                role: 'admin',
                name: 'Super Admin'
            });
            console.log('👤 Default admin user created.');
        }
    } catch (e) {
        console.log('⚠️ Init fallback to local storage');
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
        console.log('📍 Using default location');
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
// 🔐 SESSION MANAGEMENT
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
    showToast('⏰ Session expired after 30 minutes of inactivity.', 'error');
    handleLogout();
}

// ============================================================
// 👤 PASSWORD TOGGLE
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
// 🔐 AUTH - FIXED LOGIN
// ============================================================
let tapCount = 0, tapTimer = null;
document.getElementById('adminTrigger').addEventListener('click', function(e) {
    e.preventDefault();
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 5) {
        tapCount = 0;
        openAdminLogin();
    } else tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
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
        if (!supabaseClient) throw new Error('Supabase library did not load.');

        const { data: found, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', u)
            .eq('password', p)
            .limit(1);

        if (error) throw error;

        const user = found && found[0];
        if (user) {
            currentUser = user;
            closeAdminLogin();
            const shownName = user.name || user.username;
            showToast('Welcome, ' + shownName, 'success');
            document.getElementById('adminDisplayName').textContent = shownName;
            document.getElementById('adminDisplayRole').textContent = user.role === 'admin' ? 'Administrator' : user.role === 'editor' ? 'Editor' : 'Staff';
            const addBtn = document.getElementById('addStaffBtn');
            if (addBtn) addBtn.style.display = user.role === 'admin' ? '' : 'none';
            showSection('admin');
            showAdminTab('dashboard');
            startSessionTimer();
            return;
        }

        document.getElementById('loginErrorMsg').textContent = 'Invalid username or password.';
        document.getElementById('loginError').classList.add('show');
        document.getElementById('loginBtnText').textContent = 'Sign In';
        document.getElementById('loginSpinner').classList.remove('show');
        document.getElementById('loginBtn').disabled = false;

    } catch (err) {
        console.error('Login error:', err);
        document.getElementById('loginErrorMsg').textContent = 'Login failed: ' + (err.message || err);
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
// 👤 TRACKING
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
            click_data: details || {}
        };
        await supabaseInsert('tracking', record);
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
        const tracking = await supabaseGet('tracking', '*', 'created_at', 'desc');
        const b = document.getElementById('trackingBody');
        const nd = document.getElementById('trackingNoData');
        if (!tracking || tracking.length === 0) {
            b.innerHTML = '';
            nd.style.display = '';
            return;
        }
        nd.style.display = 'none';
        const slice = tracking.slice(0, 20);
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
    } catch (e) {
        console.warn('Tracking refresh error:', e);
    }
}

function refreshTracking() {
    refreshTrackingData();
    showToast('Tracking data refreshed.', 'success');
    resetSessionTimer();
}

// ============================================================
// 📊 DASHBOARD
// ============================================================
async function refreshAdminData() {
    try {
        const regs = await supabaseGet('registrations', '*', 'date', 'desc');
        const users = await supabaseGet('users', '*', 'created_at');
        const products = await supabaseGet('products', '*', 'created_at');
        const stickers = await supabaseGet('stickers', '*', 'created_at');
        const tracking = await supabaseGet('tracking', '*', 'created_at');
        const social = await supabaseGet('social_feeds', '*', 'fetched_at');
        const influencers = await supabaseGet('influencers', '*', 'created_at');

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

        ['renderRegistrations', 'renderProducts', 'renderStaff', 'renderCodes', 'renderStickers',
         'renderInfluencers', 'refreshTrackingData', 'refreshSocialFeeds', 'renderAllStickersAndAds', 'renderProductAds']
            .forEach(fn => {
                try { if (typeof window[fn] === 'function') window[fn](); }
                catch (e) { console.warn(fn + ' failed:', e); }
            });
    } catch (e) {
        console.warn('Dashboard refresh error:', e);
    }
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

async function renderHeaderStickers() {
    const container = document.getElementById('topStickerSection');
    try {
        const stickers = await supabaseGet('stickers', '*');
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
        const stickers = await supabaseGet('stickers', '*');
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
        const stickers = await supabaseGet('stickers', '*');
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
        const stickers = await supabaseGet('stickers', '*');
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

async function renderAllStickersAndAds() {
    await renderHeaderStickers();
    await renderMidStickers();
    await renderFooterStickers();
    await renderProductAds();
    await renderMarketStickers();
}

// ============================================================
// 🛒 PRODUCT ADS - BBC STYLE
// ============================================================
async function renderProductAds() {
    try {
        const products = await supabaseGet('products', '*', 'created_at', 'desc');
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
        console.warn('Product ads error:', e);
    }
}

// ============================================================
// 🛍️ MARKET RENDER
// ============================================================
async function renderMarket() {
    const grid = document.getElementById('marketGrid');
    try {
        const products = await supabaseGet('products', '*', 'created_at', 'desc');
        const active = (products || []).filter(p => p.status === 'active');
        if (!active || active.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-16" style="color:var(--fg-muted);"><i class="fas fa-store fa-3x mb-4" style="opacity:0.3;"></i><p>No products available yet.</p></div>';
            return;
        }
        grid.innerHTML = active.map(p => `
            <div class="product-bbc reveal" onclick="viewProduct('${p.id}')" style="cursor:pointer;">
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
            </div>
        `).join('');
        setTimeout(initRevealAnimations, 100);
    } catch (e) {
        console.warn('Market render error:', e);
    }
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
    document.getElementById('lightboxImg').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23161110"/%3E%3Ctext x="200" y="210" font-size="48" text-anchor="middle" fill="%23c8956c" font-family="serif" font-weight="bold"%3ESMI%3C/text%3E%3C/svg%3E';
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
    addBotMessage("Good day, and welcome to Stars Meet Investors. I'm your concierge — here to help you learn about our platform. How may I assist you today?");
    showQuickReplies(['What is SMI?', 'How to Register', 'Upcoming Events', 'Investor Requirements', 'Contact Support']);
}

function showQuickReplies(options) {
    const q = document.getElementById('chatQuick');
    q.innerHTML = options.map(o => `<button class="chat-quick-btn" onclick="handleQuickReply('${o.replace(/'/g, "\\'")}')">${o}</button>`).join('');
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
        addBotMessage("Stars Meet Investors is a premier platform that bridges ambitious businesses with strategic investors. We've facilitated over $24 million in investment capital and closed 35+ deals.");
        showQuickReplies(['How to Register', 'Upcoming Events', 'Investor Requirements']);
        return;
    }
    if (/register|registration|sign\s*up|how\s*to\s*join|apply|enroll/i.test(ql)) {
        addBotMessage("Registration is handled personally through our WhatsApp channel. When you click <strong>Register</strong> on our website, you'll be connected directly with our registration team. Would you like me to redirect you to WhatsApp to begin?");
        showQuickReplies(['Yes, take me to WhatsApp', 'What info do I need?']);
        return;
    }
    if (/yes.*whatsapp|take me|redirect|open whatsapp/i.test(ql)) {
        goToWhatsAppRegister();
        addBotMessage("Redirecting you to WhatsApp now. Our team will assist you shortly!");
        return;
    }
    if (/contact|support|help\s*me|human|real\s*person|speak|talk\s*to|agent|whatsapp|phone\s*number/i.test(ql)) {
        addBotMessage("You can reach us through:<br><br>• <strong>WhatsApp</strong>: <a href='https://wa.me/23231286286' target='_blank'>+23231286286</a><br>• <strong>Email</strong>: info@starsmeetinvestors.com<br>• <strong>Phone</strong>: +232 31 286 286");
        showQuickReplies(['Open WhatsApp', 'Ask something else']);
        return;
    }
    if (/thank|thanks|appreciate|grateful/i.test(ql)) {
        addBotMessage("You're most welcome. It's been a pleasure assisting you. Wishing you the very best on your investment journey.");
        showQuickReplies(['Register Now', 'Ask something else']);
        return;
    }
    addBotMessage("I appreciate your question. For detailed, personalized answers, I'd recommend speaking directly with our team on WhatsApp at <a href='https://wa.me/23231286286' target='_blank'>+23231286286</a>.");
    showQuickReplies(['Open WhatsApp', 'Ask about SMI', 'How to Register']);
}

// ============================================================
// 📞 WHATSAPP
// ============================================================
function goToWhatsAppRegister() {
    const msg = encodeURIComponent('Hello Stars Meet Investors! I would like to register my business. Kindly guide me through the registration process.');
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
// 🎨 PARTICLES
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
        document.getElementById('mainNav').style.boxShadow = window.scrollY > 50 ? '0 4px 30px rgba(0,0,0,0.35)' : 'none';
        resetSessionTimer();
    });
}

// ============================================================
// 🚀 INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    await testSupabaseConnection();
    await initData();
    await detectLocation();
    initGallery();
    initParticles();
    initRevealAnimations();
    initCounters();
    initNavScroll();
    await renderAllStickersAndAds();
    await renderMarket();
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

    console.log('🚀 Stars Meet Investors loaded successfully!');
    console.log('🗄️ Connected to Supabase');
    console.log('📍 Location: ' + visitorLocation.full);
    console.log('🔑 Default login: admin / starsmeet2025');
});