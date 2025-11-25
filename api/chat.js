// Vercel Serverless Function for AI Chat
// 這個函數會代理請求到 Gemini API

export default async function handler(req, res) {
    // 只允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // 從環境變數取得 Gemini API Key
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // 構建提示詞，讓 AI 扮演士林夜市的導遊
        const systemPrompt = `你是一位專業的士林夜市在地導遊，熟悉所有美食、攤位和交通資訊。
請用親切、熱情的語氣回答遊客的問題。回答要簡潔實用，不超過150字。
如果問題與士林夜市無關，可以禮貌地引導回夜市相關話題。`;

        const fullPrompt = `${systemPrompt}\n\n遊客問題：${message}\n\n請回答：`;

        // 調用 Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
            return res.status(500).json({ error: 'AI service error' });
        }

        const data = await geminiResponse.json();
        
        // 提取回覆文字
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                     '抱歉，我暫時無法回答這個問題。';

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Error in chat handler:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            reply: '抱歉，服務暫時無法使用，請稍後再試。'
        });
    }
}

