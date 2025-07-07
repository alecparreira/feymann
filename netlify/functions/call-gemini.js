exports.handler = async function(event) {
    // Apenas permite pedidos do tipo POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Pega a chave secreta das variáveis de ambiente da Netlify.
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (AIzaSyDeXRGnLh8F63nEeDFBjYveJSnjKkMNbRA) {
        console.error("A variável de ambiente GEMINI_API_KEY não está definida.");
        return { statusCode: 500, body: "Erro de configuração do servidor: a chave da API não foi encontrada." };
    }
    
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
        const body = JSON.parse(event.body);
        const { type, text, history } = body;

        let prompt;
        let payloadContents;

        // Determina o que fazer com base no 'type' enviado pelo frontend.
        switch (type) {
            case 'simplify':
                prompt = `Simplifique o seguinte conceito como se estivesse a explicar a uma criança de 5 anos, usando analogias simples. Não use jargões. Conceito: "${text}"`;
                payloadContents = [{ role: "user", parts: [{ text: prompt }] }];
                break;
            
            case 'generate_questions':
                prompt = `Aja como um tutor usando a Técnica de Feynman. Leia a seguinte afirmação e gere 3 perguntas socráticas que investiguem os pontos fracos, jargões ou lacunas lógicas. Afirmação: "${text}"`;
                payloadContents = [{ role: "user", parts: [{ text: prompt }] }];
                break;

            case 'chat':
                // Para o chat, o histórico completo é o conteúdo.
                payloadContents = history;
                break;

            default:
                return { statusCode: 400, body: "Tipo de pedido inválido." };
        }

        const payload = {
            contents: payloadContents,
            // Adiciona o prompt do sistema para o chat, para guiar o comportamento da IA.
            ...(type === 'chat' && {
                systemInstruction: {
                    parts: [{ text: feynmanConstitution }]
                }
            })
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Erro da API do Gemini:", errorBody);
            return { statusCode: geminiResponse.status, body: `Erro da API do Gemini: ${errorBody}` };
        }

        const result = await geminiResponse.json();

        // Verificação de segurança para garantir que a resposta tem o formato esperado.
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
            const responseText = result.candidates[0].content.parts[0].text;
            return {
                statusCode: 200,
                body: responseText // Retorna apenas o texto da resposta.
            };
        } else {
            console.error("Estrutura de resposta inesperada do Gemini:", JSON.stringify(result, null, 2));
            return { statusCode: 500, body: "A resposta do Gemini não pôde ser processada." };
        }

    } catch (error) {
        console.error("Erro na função da Netlify:", error);
        return { statusCode: 500, body: `Ocorreu um erro interno: ${error.toString()}` };
    }
};
