// Vercel Serverless Function for AI Chat
// 這個函數會代理請求到 Gemini API

export default async function handler(req, res) {
    // 處理 CORS - 必須在所有回應之前設置
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
    
    // 設置 CORS 頭
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });
    
    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 輔助函數：設置 CORS 並返回錯誤
    const sendError = (status, error) => {
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.status(status).json({ error });
    };
    
    // 只允許 POST 請求
    if (req.method !== 'POST') {
        return sendError(405, 'Method not allowed');
    }

    const { message } = req.body;

    if (!message) {
        return sendError(400, 'Message is required');
    }

    try {
        // 從環境變數取得 Gemini API Key
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return sendError(500, 'API key not configured');
        }

        // 構建提示詞，讓 AI 扮演士林夜市的導遊「老王」
        const systemPrompt = `你是「老王」，一位在士林夜市混了20年的在地導遊。你說話很親切、有點幽默，用台灣人的口語方式回答。
你熟悉所有美食、攤位位置、交通資訊，還會給一些「巷仔內」的建議。
回答要實用、簡潔，可以用 Markdown 格式（**粗體**、列表等）讓內容更清楚。
如果問題與士林夜市無關，可以禮貌地引導回夜市相關話題。`;

        const fullPrompt = `${systemPrompt}\n\n遊客問題：${message}\n\n請回答：`;

        // 調用 Gemini API (使用 streaming)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini API error:', errorData);
            return sendError(500, 'AI service error');
        }

        // 設定 streaming 回應（CORS 頭已在前面設置）
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 緩衝

        // 讀取並轉發 stream
        const reader = geminiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // 保留最後一個不完整的行
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim() === '[DONE]') {
                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                continue;
                            }
                            
                            const data = JSON.parse(jsonStr);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            
                            if (text) {
                                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                            }
                        } catch (e) {
                            // 忽略解析錯誤，繼續處理下一行
                            console.error('Parse error:', e.message);
                        }
                    }
                }
            }
            
            // 處理剩餘的 buffer
            if (buffer.trim()) {
                if (buffer.startsWith('data: ')) {
                    try {
                        const jsonStr = buffer.slice(6);
                        const data = JSON.parse(jsonStr);
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch (e) {
                        // 忽略
                    }
                }
            }
        } finally {
            reader.releaseLock();
            res.end();
        }

    } catch (error) {
        console.error('Error in chat handler:', error);
        return sendError(500, 'Internal server error');
    }
}

