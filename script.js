// AI 聊天功能 - 支援 Streaming 和 Markdown

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow.classList.contains('hidden')) {
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('chat-slide-in');
        document.getElementById('user-input').focus();
    } else {
        chatWindow.classList.add('hidden');
        chatWindow.classList.remove('chat-slide-in');
    }
}

function quickAsk(msg) {
    document.getElementById('user-input').value = msg;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (!message) return;

    // 1. 顯示使用者訊息
    appendMessage('user', message);
    input.value = '';

    // 2. 建立 AI 訊息容器（用於 streaming）
    const aiMessageDiv = appendMessageContainer('ai');
    aiMessageDiv.innerHTML = '<span class="animate-pulse">...</span>';

    try {
        // TODO: 請將此 URL 替換為你的 Vercel 部署 URL
        const response = await fetch('https://night-market-cyan.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) throw new Error('API 錯誤: ' + response.status);

        // 3. 處理串流回應
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.text) {
                            fullText += data.text;
                            
                            // 使用 marked 解析 Markdown（確保已載入 marked.js）
                            if (typeof marked !== 'undefined') {
                                aiMessageDiv.innerHTML = marked.parse(fullText);
                            } else {
                                aiMessageDiv.textContent = fullText;
                            }

                            // 自動捲動到最新訊息
                            const chatMessages = document.getElementById('chat-messages');
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    } catch (e) {
                        // 忽略解析錯誤
                    }
                }
            }
        }

    } catch (error) {
        console.error('發生錯誤:', error);
        aiMessageDiv.innerHTML = '哎呀！老王現在有點忙（連線錯誤），請稍後再試！😅';
    }
}

// 輔助函式：建立訊息容器（返回內容 div 以便後續更新）
function appendMessageContainer(sender) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex items-start gap-2';

    div.innerHTML = `
        <div class="w-8 h-8 bg-neonPink rounded-full flex-shrink-0 flex items-center justify-center text-black font-bold text-xs">王</div>
        <div class="bg-gray-800 text-gray-200 p-3 rounded-r-lg rounded-bl-lg text-sm border border-gray-700 max-w-[90%] prose"></div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return div.querySelector('.prose'); // 返回內容容器
}

// 輔助函式：顯示使用者訊息
function appendMessage(sender, text) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'flex justify-end' : 'flex items-start gap-2';

    if (sender === 'user') {
        div.innerHTML = `<div class="bg-neonPink text-black p-3 rounded-l-lg rounded-br-lg text-sm font-bold max-w-[80%]">${text}</div>`;
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter 鍵發送
document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

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
