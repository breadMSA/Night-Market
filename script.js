// AI 聊天功能
let chatOpen = false;

function openChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatButton = document.getElementById('chatButton');
    chatWindow.classList.remove('hidden');
    chatButton.style.display = 'none';
    chatOpen = true;
    document.getElementById('chatInput').focus();
}

function closeChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatButton = document.getElementById('chatButton');
    chatWindow.classList.add('hidden');
    chatButton.style.display = 'flex';
    chatOpen = false;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 顯示用戶訊息
    addMessage(message, 'user');
    input.value = '';
    
    // 顯示載入中
    const loadingId = addMessage('正在思考...', 'bot', true);
    
    try {
        // 發送到 Vercel Function
        // TODO: 請將此 URL 替換為你的 Vercel 部署 URL
        const response = await fetch('https://your-vercel-app.vercel.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('API 請求失敗');
        }
        
        const data = await response.json();
        
        // 移除載入訊息，顯示回覆
        removeMessage(loadingId);
        addMessage(data.reply || '抱歉，我無法理解你的問題。', 'bot');
        
    } catch (error) {
        console.error('Error:', error);
        removeMessage(loadingId);
        addMessage('抱歉，服務暫時無法使用，請稍後再試。', 'bot');
    }
}

function addMessage(text, sender, isLoading = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now() + '-' + Math.random();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `rounded-lg p-3 ${
        sender === 'user' 
            ? 'bg-yellow-400 text-black ml-auto max-w-[80%]' 
            : 'bg-gray-800 text-gray-300 max-w-[80%]'
    }`;
    
    messageDiv.innerHTML = `<p>${isLoading ? '<span class="animate-pulse">' + text + '</span>' : text}</p>`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

// 平滑滾動
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 響應式導覽列
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
        nav.classList.add('shadow-lg');
    } else {
        nav.classList.remove('shadow-lg');
    }
});

