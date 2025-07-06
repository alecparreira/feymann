exports.handler = async function(event, context) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
        const payload = JSON.parse(event.body);

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            return { statusCode: response.status, body: response.statusText };
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: text
        };

    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};