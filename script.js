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
        const response = await fetch('https://night-market-cyan.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            throw new Error('API 錯誤: ' + response.status);
        }

        // 檢查是否為 streaming 回應
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('text/event-stream')) {
            // 處理 SSE streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                console.log('Received chunk:', chunk);
                
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr) {
                                const data = JSON.parse(jsonStr);
                                console.log('Parsed data:', data);
                                
                                if (data.text) {
                                    fullText += data.text;
                                    
                                    // 使用 marked 解析 Markdown
                                    if (typeof marked !== 'undefined') {
                                        aiMessageDiv.innerHTML = marked.parse(fullText);
                                    } else {
                                        aiMessageDiv.textContent = fullText;
                                    }

                                    // 自動捲動
                                    const chatMessages = document.getElementById('chat-messages');
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            }
                        } catch (e) {
                            console.error('Parse error:', e, 'Line:', line);
                        }
                    }
                }
            }
            
            // 如果沒有收到任何文字
            if (!fullText) {
                aiMessageDiv.innerHTML = '抱歉，我沒有收到回應。請再試一次！';
            }
        } else {
            // 非 streaming 回應，直接讀取 JSON
            const data = await response.json();
            console.log('Non-streaming response:', data);
            
            if (data.reply) {
                if (typeof marked !== 'undefined') {
                    aiMessageDiv.innerHTML = marked.parse(data.reply);
                } else {
                    aiMessageDiv.textContent = data.reply;
                }
            } else if (data.error) {
                aiMessageDiv.innerHTML = '抱歉，發生錯誤：' + data.error;
            }
        }

    } catch (error) {
        console.error('發生錯誤:', error);
        aiMessageDiv.innerHTML = '哎呀！老王現在有點忙（連線錯誤），請稍後再試！😅<br><small>錯誤：' + error.message + '</small>';
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

// ========== Google Maps 控制功能 ==========

// 士林夜市座標
const SHILIN_LAT = 25.0878018;
const SHILIN_LNG = 121.5240855;

// 重新定位到士林夜市
function resetMapToShilin() {
    const mapFrame = document.getElementById('mapFrame');
    // 更新 iframe src 重新載入地圖，聚焦士林夜市
    mapFrame.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.4969287885047!2d${SHILIN_LNG}!3d${SHILIN_LAT}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a910ff8124b1%3A0x352897c38223de95!2z5aOr5p6X5aSc5biC!5e0!3m2!1szh-TW!2stw!4v${Date.now()}!5m2!1szh-TW!2stw`;
}

// 規劃路線（在新視窗開啟 Google Maps 路線規劃）
function planRoute() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // 開啟 Google Maps 路線規劃
                const url = `https://www.google.com/maps/dir/${lat},${lng}/${SHILIN_LAT},${SHILIN_LNG}`;
                window.open(url, '_blank');
            },
            (error) => {
                // 如果無法取得位置，直接開啟士林夜市的地圖
                const url = `https://www.google.com/maps/dir//${SHILIN_LAT},${SHILIN_LNG}`;
                window.open(url, '_blank');
                console.error('無法取得位置:', error);
            }
        );
    } else {
        // 瀏覽器不支援地理定位，直接開啟地圖
        const url = `https://www.google.com/maps/dir//${SHILIN_LAT},${SHILIN_LNG}`;
        window.open(url, '_blank');
    }
}

// 計算並顯示距離
function showDistance() {
    const distanceBtn = document.getElementById('distanceBtn');
    
    if (navigator.geolocation) {
        distanceBtn.textContent = '📍 計算中...';
        distanceBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // 計算直線距離（使用 Haversine 公式）
                const distance = calculateDistance(lat, lng, SHILIN_LAT, SHILIN_LNG);
                
                if (distance < 1) {
                    distanceBtn.textContent = `📍 ${Math.round(distance * 1000)}m`;
                } else {
                    distanceBtn.textContent = `📍 ${distance.toFixed(1)}km`;
                }
                
                distanceBtn.disabled = false;
                
                // 5秒後恢復原本文字
                setTimeout(() => {
                    distanceBtn.textContent = '📍 距離';
                }, 5000);
            },
            (error) => {
                distanceBtn.textContent = '📍 無法定位';
                distanceBtn.disabled = false;
                console.error('無法取得位置:', error);
                
                setTimeout(() => {
                    distanceBtn.textContent = '📍 距離';
                }, 3000);
            }
        );
    } else {
        alert('您的瀏覽器不支援地理定位功能');
    }
}

// Haversine 公式計算兩點間距離（公里）
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑（公里）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
