import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
import OpenAI from 'openai';

@Injectable()
export class AIService implements OnModuleInit {
    constructor(private configService: ConfigService) { }

    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private openai: OpenAI;

    // Cấu hình cho OpenAI
    private readonly openAIConfig = {
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,    // Giảm temperature để có kết quả chính xác và nhất quán hơn
        max_tokens: 1000,    // Số tokens tối đa cho mỗi phản hồi
        top_p: 0.9,         // Lọc các tokens có xác suất thấp
        frequency_penalty: 0.2, // Giảm lặp lại từ ngữ
        presence_penalty: 0.1,  // Khuyến khích đa dạng từ vựng
    };

    // Cấu hình retry
    private readonly retryConfig = {
        maxRetries: 3,           // Số lần thử lại tối đa cho mỗi model
        retryDelay: 1000,        // Delay giữa các lần thử (ms)
        maxModelAttempts: 5,     // Số model tối đa sẽ thử
    };

    // Phân nhóm models theo use case
    private readonly modelGroups = {
        fastModels: [
            'llama-3.1-8b-instant',
            'llama3-8b-8192',
            'llava-v1.5-7b-4096-preview'
        ],
        balancedModels: [
            'gemma-7b-it',
            'llama-guard-3-8b',
            'llama-3.1-70b-versatile'
        ],
        powerfulModels: [
            'mixtral-8x7b-32768',
            'llama-3.2-90b-text-preview',
            'llama3-70b-8192'
        ],
        specialModels: [
            'llama3-groq-8b-8192-tool-use-preview',
            'llama3-groq-70b-8192-tool-use-preview',
            'llama-3.2-11b-vision-preview',
            'gemma2-9b-it'
        ]
    };

    // Hàm delay helper
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Chọn model dựa trên loại lỗi
    private selectModelForError(error: any, currentModel: string): string[] {
        const errorCode = error.status;
        const errorMessage = error.message?.toLowerCase() || '';

        // Lấy nhóm hiện tại của model
        let currentGroup = Object.entries(this.modelGroups)
            .find(([_, models]) => models.includes(currentModel))?.[0] || 'fastModels';

        switch (errorCode) {
            case 429: // Rate limit
                // Nếu đang dùng fast model, chuyển sang balanced
                return currentGroup === 'fastModels' 
                    ? this.modelGroups.balancedModels 
                    : this.modelGroups.powerfulModels;
            
            case 503: // Service unavailable
            case 504: // Gateway timeout
                // Thử các model trong cùng nhóm trước
                return this.modelGroups[currentGroup];

            case 400: // Bad request
                if (errorMessage.includes('context length')) {
                    // Nếu lỗi context length, thử các model có context dài hơn
                    return [
                        'llama3-8b-8192',
                        'mixtral-8x7b-32768',
                        'llama3-70b-8192'
                    ];
                }
                break;
        }

        // Mặc định thử các model nhanh
        return this.modelGroups.fastModels;
    }

    onModuleInit() {
        // Initialize Gemini
        const geminiApiKey = this.configService.get<string>('apiKeys.geminiApiKey');
        if (!geminiApiKey) {
            throw new Error('Gemini API key is not configured');
        }
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        // Initialize Groq
        const groqApiKey = this.configService.get<string>('apiKeys.groqApiKey');
        if (!groqApiKey) {
            throw new Error('Groq API key is not configured');
        }
        this.openai = new OpenAI({
            apiKey: groqApiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }

    async generateStructuredOutput<T>(prompt: string, context: string, format: string, infoFormat?: string): Promise<T> {
        const formattedPrompt = `
    Context: ${context}
    
    User Command: "${prompt}"
    
    Instructions:
    1. Phân tích lệnh và xác định loại yêu cầu:
       - Điều khiển thiết bị: bật/tắt, điều chỉnh giá trị
       - Truy vấn thông tin thiết bị

    2. Xác định thiết bị từ context:
       - Tìm thiết bị theo tên và phòng
       - Nếu không có tên phòng, tìm theo tên thiết bị
       - Nếu không rõ thiết bị, trả về rỗng

    3. Nếu lệnh yêu cầu điều khiển thiết bị:
       - Xác định trạng thái cần thay đổi (bật/tắt)
       - Xác định giá trị cần điều chỉnh (nếu có)
       - Chỉ điều khiển thiết bị được yêu cầu
       - Trả về thông tin thiết bị cần thay đổi theo định dạng:
         ${format} không bọc trong block code dạng JSON có thể parse được để code có thể parse được một cách chính xác
         Trong đó:
         - s: 1 (bật) hoặc 0 (tắt)
         - v: giá trị cần điều chỉnh (nhiệt độ, độ sáng...)
        
        - Nếu thông tin từ người dùng bao gồm trạng thái hoặc cảm xúc như "nóng" hoặc "lạnh", bạn cần phân tích và xác định các thiết bị cần điều chỉnh để phù hợp với hoàn cảnh. Ví dụ:
           - Nếu người dùng cảm thấy "nóng", hãy xem xét tắt đèn sưởi và bật điều hòa hoặc quạt.
           - Nếu người dùng cảm thấy "lạnh", hãy xem xét bật đèn sưởi và tắt điều hòa hoặc quạt.
           - Đảm bảo rằng các hành động này phù hợp với ngữ cảnh và không gây bất tiện cho người dùng.

    4. Nếu lệnh yêu cầu truy vấn thông tin thiết bị:
       - Chỉ bao gồm thiết bị cần truy vấn, không đưa ra các thông tin bảo mật như "id, ID" trường hợp này ko trả về
       - Trả về thông tin chi tiết thiết bị dưới dạng text theo định dạng:
         ${infoFormat ?? "No info format provided"} không bọc trong block code 
         

    5. Nếu không có thiết bị phù hợp hoặc không cần thay đổi, trả về rỗng.

    6. Ví dụ lệnh điều khiển:
       - "bật đèn phòng khách" -> {"type":"control","d":[{"i":"id-1","s":1,"v":null}]}
       - "tắt đèn phòng ngủ" -> {"type":"control","d":[{"i":"id-2","s":0,"v":null}]}
       - "chỉnh nhiệt độ điều hòa phòng ngủ lên 25 độ" -> {"type":"control","d":[{"i":"id-3","s":1,"v":25}]}
       - "giảm độ sáng đèn phòng khách xuống 50%" -> {"type":"control","d":[{"i":"id-1","s":1,"v":50}]}
        - Trả về text string JSON trực tiếp, không bọc trong block code dạng JSON để code có thể parse được chính xác
       - Đảm bảo JSON hợp lệ và có thể parse được
       - Không thêm bất kỳ text nào khác ngoài JSON string

    7. Ví dụ lệnh truy vấn:
       - "nhiệt độ phòng khách bao nhiêu" -> {"type":"info","text":"Nhiệt độ phòng khách đang là 25°C"}
       - "đèn phòng ngủ có bật không" -> {"type":"info","text":"Đèn phòng ngủ đang tắt"}
    `;

        try {
            // Try OpenAI/Groq first with optimized settings
            const messages = [
                {
                    role: 'system',
                    content: `Bạn là trợ lý AI nhà thông minh, chuyên cung cấp phản hồi JSON có cấu trúc cho việc điều khiển và truy vấn thông tin thiết bị. 
                    Luôn trả về JSON hợp lệ, không kèm theo bất kỳ văn bản hoặc định dạng bổ sung nào.
                    Hiểu và xử lý các câu lệnh tiếng Việt một cách chính xác.
                    Đảm bảo phản hồi phù hợp với ngữ cảnh văn hóa và ngôn ngữ Việt Nam.`
                },
                { 
                    role: 'user', 
                    content: formattedPrompt 
                }
            ];

            const result = await this.tryGroqCompletion(messages, {
                ...this.openAIConfig,
                stream: false,
                response_format: { type: "json_object" }
            });
            const text = result.choices[0].message.content?.trim() || '';
            const cleanedText = this.cleanText(text);
            
            if (this.isValidJSON(cleanedText)) {
                return JSON.parse(cleanedText) as T;
            }
            
            // If OpenAI/Groq fails or returns invalid JSON, fall back to Gemini
            throw new Error('Invalid JSON from OpenAI/Groq');
            
        } catch (error) {
            try {
                // Fallback to Gemini
                const result = await this.model.generateContent(formattedPrompt);
                const response = result.response;
                const text = response.text().trim();
                const cleanedText = this.cleanText(text);
                
                if (!this.isValidJSON(cleanedText)) {
                    throw new Error(`Invalid JSON structure in AI response: ${cleanedText}`);
                }
                return JSON.parse(cleanedText) as T;
            } catch (geminiError) {
                throw new Error(`Failed to generate structured output: ${error.message}. Gemini fallback error: ${geminiError.message}`);
            }
        }
    }
    
    private async tryGroqCompletion(messages: Array<{ role: string, content: string }>, config: any): Promise<any> {
        let lastError: Error | null = null;
        let attemptCount = 0;
        let currentModel = this.openAIConfig.model;
        
        const triedModels = new Set<string>();

        while (attemptCount < this.retryConfig.maxModelAttempts) {
            for (let retryCount = 0; retryCount < this.retryConfig.maxRetries; retryCount++) {
                try {
                    attemptCount++;
                    console.log(`Thử model ${currentModel} (Lần thử ${retryCount + 1}/${this.retryConfig.maxRetries})`);
                    
                    return await this.openai.chat.completions.create({
                        ...config,
                        model: currentModel,
                        messages,
                    });
                } catch (error) {
                    const errorMessage = error.message || 'Không có chi tiết lỗi';
                    console.warn(`Lỗi với model ${currentModel} (Lần ${retryCount + 1}): ${errorMessage}`);
                    
                    lastError = error;
                    
                    // Nếu còn lần thử, đợi một chút rồi thử lại
                    if (retryCount < this.retryConfig.maxRetries - 1) {
                        await this.delay(this.retryConfig.retryDelay);
                        continue;
                    }

                    // Hết số lần thử với model hiện tại, chọn model mới
                    const suggestedModels = this.selectModelForError(error, currentModel)
                        .filter(model => !triedModels.has(model));

                    if (suggestedModels.length > 0) {
                        currentModel = suggestedModels[0];
                        triedModels.add(currentModel);
                        console.log(`Chuyển sang model ${currentModel}`);
                        break;
                    }
                }
            }
        }
        
        throw lastError || new Error(`Tất cả các model đều thất bại sau ${attemptCount} lần thử`);
    }

    async generateGroqCompletion(prompt: string, model: string = 'llama-3.1-8b-instant'): Promise<string> {
        try {
            const chatCompletion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model,
            });
            return chatCompletion.choices[0].message.content || '';
        } catch (error) {
            throw new Error(`Failed to generate Groq completion: ${error.message}`);
        }
    }

    async generateChat(history?: Content[], systemInstruction?: string) {
        try {
            const chat = this.model.startChat({
                history: history,
                systemInstruction: systemInstruction,
            });
            return chat;
        } catch (error) {
            throw new Error(`Failed to generate chat response: ${error.message}`);
        }
    }

    async sendMessage(chat: any, message: string) {
        try {
            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    private cleanText(text: string): string {
        // Remove code block markers and any whitespace around them
        const cleaned = text
            .replace(/```(?:json)?\s*|\s*```/g, '')  // Remove ```json, ``` and any whitespace around them
            .replace(/^\s+|\s+$/g, '')               // Trim whitespace from start and end
            .replace(/[\n\r]+/g, '')                 // Remove any newlines/carriage returns
            .trim();                                 // Final trim for safety
        
        // If the text starts with a valid JSON character, return it
        if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
            return cleaned;
        }
        
        // Try to find JSON in the text
        const jsonMatch = cleaned.match(/({[\s\S]*}|\[[\s\S]*\])/);
        return jsonMatch ? jsonMatch[0] : cleaned;
    }

    private isValidJSON(input: string): boolean {
        try {
            JSON.parse(input);
            return true;
        } catch {
            return false;
        }
    }
}