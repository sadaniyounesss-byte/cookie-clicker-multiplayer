// إدارة المصادقة
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('cookieToken');
        this.user = JSON.parse(localStorage.getItem('cookieUser') || 'null');
        this.isLoggedIn = !!this.token;
    }
    
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'خطأ في تسجيل الدخول');
            }
            
            this.token = data.token;
            this.user = data.user;
            this.isLoggedIn = true;
            
            localStorage.setItem('cookieToken', this.token);
            localStorage.setItem('cookieUser', JSON.stringify(this.user));
            
            return { success: true, user: this.user };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'خطأ في التسجيل');
            }
            
            this.token = data.token;
            this.user = data.user;
            this.isLoggedIn = true;
            
            localStorage.setItem('cookieToken', this.token);
            localStorage.setItem('cookieUser', JSON.stringify(this.user));
            
            return { success: true, user: this.user };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    logout() {
        this.token = null;
        this.user = null;
        this.isLoggedIn = false;
        
        localStorage.removeItem('cookieToken');
        localStorage.removeItem('cookieUser');
        
        window.location.reload();
    }
    
    async updateGameData(gameData) {
        if (!this.isLoggedIn) return;
        
        try {
            const response = await fetch('/api/auth/update-game', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ gameData })
            });
            
            return await response.json();
        } catch (error) {
            console.error('خطأ في تحديث بيانات اللعبة:', error);
        }
    }
    
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }
}