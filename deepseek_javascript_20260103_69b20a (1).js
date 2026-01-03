// إدارة المصادقة واللعب الجماعي
const authManager = new AuthManager();
const multiplayerManager = new MultiplayerManager();

// تحديث حالة اللعبة لتشمل بيانات الخادم
let gameState = {
    cookies: 0,
    totalCookies: 0,
    cookiesPerSecond: 0,
    upgrades: [],
    playTime: 0,
    level: 1,
    achievements: [],
    lastUpdate: Date.now()
};

// تهيئة اللعبة
async function initGame() {
    // تحميل من localStorage أولاً
    loadGameState();
    
    // إذا كان المستخدم مسجلاً، جلب بياناته من الخادم
    if (authManager.isLoggedIn) {
        await loadUserData();
    }
    
    renderGame();
    startGameLoop();
    setupEventListeners();
    updateLeaderboard();
    
    // الاتصال بخادم WebSocket إذا كان مسجلاً
    if (authManager.isLoggedIn && authManager.user.id) {
        multiplayerManager.connect(authManager.user.id);
    }
}

// تحميل بيانات المستخدم من الخادم
async function loadUserData() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: authManager.getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.gameData) {
                // دمج البيانات المحلية مع بيانات الخادم
                Object.assign(gameState, data.user.gameData);
                saveGameState();
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
    }
}

// حفظ حالة اللعبة (محلياً وعلى الخادم)
function saveGameState() {
    // حفظ محلي
    localStorage.setItem('cookieClickerGame', JSON.stringify(gameState));
    
    // حفظ على الخادم إذا كان مسجلاً
    if (authManager.isLoggedIn) {
        authManager.updateGameData(gameState);
        
        // إرسال تحديث عبر WebSocket
        if (multiplayerManager.ws) {
            multiplayerManager.send({
                type: 'game_update',
                userId: authManager.user.id,
                gameData: gameState
            });
        }
    }
}

// تحديث لوحة المتصدرين الحقيقية
async function updateLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard/top');
        const leaders = await response.json();
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        leaders.forEach((player, index) => {
            const leaderItem = document.createElement('div');
            leaderItem.className = 'leader-item';
            leaderItem.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="player-name">${player.username}</span>
                <span class="player-score">${formatNumber(player.score)}</span>
                <span class="player-level">مستوى ${player.level}</span>
            `;
            leaderboardList.appendChild(leaderItem);
        });
    } catch (error) {
        console.error('خطأ في تحميل المتصدرين:', error);
    }
}

// تحديث أحداث تسجيل الدخول والتسجيل
function setupAuthEventListeners() {
    // تسجيل الدخول
    document.getElementById('submit-login').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const result = await authManager.login(username, password);
        
        if (result.success) {
            alert('تم تسجيل الدخول بنجاح!');
            document.getElementById('login-modal').style.display = 'none';
            window.location.reload();
        } else {
            alert(`خطأ: ${result.error}`);
        }
    });
    
    // التسجيل
    document.getElementById('submit-register').addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        const result = await authManager.register(username, email, password);
        
        if (result.success) {
            alert('تم إنشاء الحساب بنجاح!');
            document.getElementById('register-modal').style.display = 'none';
            window.location.reload();
        } else {
            alert(`خطأ: ${result.error}`);
        }
    });
    
    // تبديل بين نموذج التسجيل والدخول
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'block';
    });
    
    // زر تسجيل الخروج
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        authManager.logout();
    });
}

// تحديث واجهة المستخدم لعرض حالة المصادقة
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    
    if (authManager.isLoggedIn) {
        userInfo.innerHTML = `
            <span id="username">${authManager.user.username}</span>
            <button id="logout-btn">تسجيل الخروج</button>
            <button id="profile-btn">الملف الشخصي</button>
        `;
        
        // إضافة أحداث للأزرار الجديدة
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            authManager.logout();
        });
        
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            showProfileModal();
        });
        
        loginBtn.style.display = 'none';
    } else {
        userInfo.innerHTML = '<span id="username">زائر</span>';
        loginBtn.style.display = 'block';
    }
}

// عرض نافذة الملف الشخصي
function showProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profile-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>الملف الشخصي</h2>
            <div class="profile-info">
                <p><strong>اسم المستخدم:</strong> ${authManager.user.username}</p>
                <p><strong>البريد الإلكتروني:</strong> ${authManager.user.email}</p>
                <p><strong>المستوى:</strong> ${gameState.level}</p>
                <p><strong>إجمالي الكوكيز:</strong> ${formatNumber(gameState.totalCookies)}</p>
                <p><strong>وقت اللعب:</strong> ${formatPlayTime(gameState.playTime)}</p>
            </div>
            <h3>الإنجازات</h3>
            <div class="achievements-list">
                ${renderAchievements()}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // إغلاق النافذة
    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
    });
}

// تحديث حلقة اللعبة الرئيسية لتشمل تحديثات الخادم
function startGameLoop() {
    setInterval(async () => {
        // زيادة الكوكيز
        gameState.cookies += gameState.cookiesPerSecond / 10;
        gameState.totalCookies += gameState.cookiesPerSecond / 10;
        
        // زيادة وقت اللعب
        gameState.playTime += 0.1;
        
        // زيادة المستوى
        const newLevel = Math.floor(gameState.totalCookies / 10000) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            checkAchievements();
        }
        
        // تحديث البيانات على الخادم كل 30 ثانية
        if (Date.now() - gameState.lastUpdate > 30000) {
            saveGameState();
            gameState.lastUpdate = Date.now();
        }
        
        renderGame();
        
        // تحديث تلقائي للوحة المتصدرين كل دقيقة
        if (Math.floor(gameState.playTime) % 60 === 0) {
            updateLeaderboard();
        }
        
    }, 100);
}

// بدء اللعبة مع المصادقة
window.addEventListener('DOMContentLoaded', async () => {
    await initGame();
    setupAuthEventListeners();
    updateAuthUI();
});