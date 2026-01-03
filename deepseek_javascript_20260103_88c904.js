// حالة اللعبة الأساسية
let gameState = {
    cookies: 0,
    totalCookies: 0,
    cookiesPerSecond: 0,
    upgrades: [],
    playTime: 0,
    level: 1,
    username: null,
    isLoggedIn: false
};

// التطويرات المتاحة
const availableUpgrades = [
    { id: 1, name: "مؤشر", cost: 10, cps: 1, description: "ينقر تلقائياً", owned: 0 },
    { id: 2, name: "جدة", cost: 100, cps: 5, description: "تخبز الكوكيز", owned: 0 },
    { id: 3, name: "مزرعة", cost: 500, cps: 10, description: "تزرع الكوكيز", owned: 0 },
    { id: 4, name: "مصنع", cost: 2000, cps: 50, description: "ينتج الكوكيز", owned: 0 },
    { id: 5, name: "منجم", cost: 5000, cps: 100, description: "ينقب عن الكوكيز", owned: 0 }
];

// تهيئة اللعبة
function initGame() {
    loadGameState();
    renderGame();
    startGameLoop();
    setupEventListeners();
    updateLeaderboard();
}

// تحميل حالة اللعبة من localStorage
function loadGameState() {
    const savedState = localStorage.getItem('cookieClickerGame');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(gameState, parsed);
    }
}

// حفظ حالة اللعبة
function saveGameState() {
    localStorage.setItem('cookieClickerGame', JSON.stringify(gameState));
}

// عرض حالة اللعبة
function renderGame() {
    document.getElementById('cookie-count').textContent = formatNumber(gameState.cookies);
    document.getElementById('total-cookies').textContent = formatNumber(gameState.totalCookies);
    document.getElementById('cookies-per-second').textContent = `${formatNumber(gameState.cookiesPerSecond)} كوكيز/ثانية`;
    document.getElementById('player-level').textContent = gameState.level;
    
    // تحديث اسم المستخدم إذا كان مسجل الدخول
    if (gameState.username) {
        document.getElementById('username').textContent = gameState.username;
    }
    
    renderUpgrades();
    updatePlayTime();
}

// تنسيق الأرقام
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return Math.floor(num);
}

// عرض التطويرات
function renderUpgrades() {
    const upgradesList = document.getElementById('upgrades-list');
    upgradesList.innerHTML = '';
    
    availableUpgrades.forEach(upgrade => {
        const canAfford = gameState.cookies >= upgrade.cost;
        const upgradeElement = document.createElement('div');
        upgradeElement.className = `upgrade-item ${canAfford ? 'affordable' : ''}`;
        upgradeElement.innerHTML = `
            <h4>${upgrade.name} (${upgrade.owned})</h4>
            <p>${upgrade.description}</p>
            <p>الإنتاج: ${upgrade.cps} كوكيز/ثانية</p>
            <button class="buy-btn" data-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>
                شراء (${upgrade.cost} كوكيز)
            </button>
        `;
        upgradesList.appendChild(upgradeElement);
    });
}

// حدث النقر على الكوكيز
function setupEventListeners() {
    // النقر على الكوكي
    document.getElementById('cookie').addEventListener('click', () => {
        gameState.cookies++;
        gameState.totalCookies++;
        saveGameState();
        renderGame();
        
        // تأثير بصري
        const cookie = document.getElementById('cookie');
        cookie.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cookie.style.transform = 'scale(1)';
        }, 100);
    });
    
    // شراء التطويرات
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            buyUpgrade(id);
        }
    });
    
    // أحداث تسجيل الدخول
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'block';
    });
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
}

// شراء تطوير
function buyUpgrade(id) {
    const upgrade = availableUpgrades.find(u => u.id === id);
    if (!upgrade || gameState.cookies < upgrade.cost) return;
    
    gameState.cookies -= upgrade.cost;
    upgrade.owned++;
    gameState.cookiesPerSecond += upgrade.cps;
    
    // زيادة تكلفة التطوير
    upgrade.cost = Math.floor(upgrade.cost * 1.15);
    
    saveGameState();
    renderGame();
}

// تحديث وقت اللعب
function updatePlayTime() {
    const hours = Math.floor(gameState.playTime / 3600);
    const minutes = Math.floor((gameState.playTime % 3600) / 60);
    const seconds = gameState.playTime % 60;
    
    document.getElementById('play-time').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// حلقة اللعبة الرئيسية
function startGameLoop() {
    setInterval(() => {
        // زيادة الكوكيز بناءً على الإنتاج في الثانية
        gameState.cookies += gameState.cookiesPerSecond / 10;
        gameState.totalCookies += gameState.cookiesPerSecond / 10;
        
        // زيادة وقت اللعب
        gameState.playTime += 0.1;
        
        // زيادة المستوى بناءً على الكوكيز الإجمالية
        const newLevel = Math.floor(gameState.totalCookies / 10000) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
        }
        
        saveGameState();
        renderGame();
    }, 100);
}

// تحديث لوحة المتصدرين (محاكاة)
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // بيانات وهمية للمتصدرين
    const dummyLeaders = [
        { name: "أحمد", cookies: 1250000, level: 15 },
        { name: "سارة", cookies: 980000, level: 12 },
        { name: "محمد", cookies: 750000, level: 10 },
        { name: "فاطمة", cookies: 620000, level: 9 },
        { name: "خالد", cookies: 450000, level: 7 }
    ];
    
    leaderboardList.innerHTML = '';
    dummyLeaders.forEach((player, index) => {
        const leaderItem = document.createElement('div');
        leaderItem.className = 'leader-item';
        leaderItem.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-score">${formatNumber(player.cookies)}</span>
            <span class="player-level">مستوى ${player.level}</span>
        `;
        leaderboardList.appendChild(leaderItem);
    });
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', initGame);