import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "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",
    baseURL: "https://api.groq.com/openai/v1",
});

(async () => {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'Trời lạnh và đèn và điều hòa của tôi đang bật thì cần bật gì' }],
        model: 'llama-3.1-8b-instant',
    });

    console.log(chatCompletion.choices[0].message.content);
})();