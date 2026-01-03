// إدارة اللعب متعدد اللاعبين
class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.opponent = null;
        this.challengeQueue = [];
    }
    
    connect(userId) {
        this.ws = new WebSocket(`ws://localhost:3000?userId=${userId}`);
        
        this.ws.onopen = () => {
            console.log('متصل بخادم WebSocket');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('انقطع الاتصال بخادم WebSocket');
        };
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'online_users':
                this.updateOnlineUsers(data.users);
                break;
                
            case 'challenge_received':
                this.showChallengeNotification(data);
                break;
                
            case 'challenge_accepted':
                this.startChallengeSession(data);
                break;
                
            case 'challenge_started':
                this.startChallengeSession(data);
                break;
                
            case 'player_update':
                this.updateOpponentData(data);
                break;
        }
    }
    
    updateOnlineUsers(users) {
        const onlineCount = users.length;
        document.getElementById('online-count').textContent = onlineCount;
        
        // عرض قائمة المستخدمين المتصلين
        const userList = document.getElementById('online-users-list');
        if (userList) {
            userList.innerHTML = users.map(user => 
                `<div class="online-user">${user}</div>`
            ).join('');
        }
    }
    
    showChallengeNotification(data) {
        if (confirm(`${data.fromUsername} يتحداك! هل تقبل التحدي؟`)) {
            this.send({
                type: 'challenge_response',
                accepted: true,
                challengerId: data.from,
                opponentUsername: authManager.user.username
            });
        } else {
            this.send({
                type: 'challenge_response',
                accepted: false,
                challengerId: data.from
            });
        }
    }
    
    startChallengeSession(data) {
        this.roomId = data.roomId;
        this.opponent = data.opponent;
        
        // عرض واجهة التحدي
        document.getElementById('challenge-status').innerHTML = `
            <h4>تحدي ضد ${this.opponent}</h4>
            <div id="opponent-score">0 كوكيز</div>
            <div class="timer" id="challenge-timer">02:00</div>
        `;
        
        // بدء المؤقت
        this.startChallengeTimer();
    }
    
    startChallengeTimer() {
        let timeLeft = 120; // دقيقتان
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            document.getElementById('challenge-timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.endChallenge();
            }
        }, 1000);
    }
    
    endChallenge() {
        alert('انتهى التحدي!');
        this.roomId = null;
        this.opponent = null;
        document.getElementById('challenge-status').innerHTML = '';
    }
    
    updateOpponentData(data) {
        if (this.opponent && this.roomId) {
            document.getElementById('opponent-score').textContent = 
                `${formatNumber(data.gameData.cookies)} كوكيز`;
        }
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    challengeUser(targetUserId, challengeType = 'speed') {
        this.send({
            type: 'challenge',
            targetUserId,
            fromUserId: authManager.user.id,
            fromUsername: authManager.user.username,
            challengeType
        });
    }
}