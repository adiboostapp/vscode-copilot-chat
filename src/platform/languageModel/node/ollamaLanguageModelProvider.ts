import { CancellationToken } from 'vscode';
import { LanguageModelChatMessage, LanguageModelChatRequest, LanguageModelChatResponseChunk, LanguageModelCapabilities, ILanguageModelProvider, LanguageModelError } from '../common/languageModelProvider';
import { IVSCodeConfigurationService } from '../../../platform/configuration/common/configuration';
import { IFetcherService } from '../../../platform/networking/common/fetcherService'; // For API calls
import { APIUsage } from '../../../platform/networking/common/openai'; // Assuming usage structure is compatible

const OLLAMA_PROVIDER_ID = 'ollama';

export class OllamaLanguageModelProvider implements ILanguageModelProvider {
    readonly id: string = OLLAMA_PROVIDER_ID;
    readonly displayName: string = 'Ollama (Local)';

    constructor(
        @IVSCodeConfigurationService private readonly configurationService: IVSCodeConfigurationService,
        @IFetcherService private readonly fetcherService: IFetcherService
    ) {}

    private getBaseUrl(): string {
        return this.configurationService.inspect<string>('github.copilot.chat.languageModelProviders.ollama.baseUrl')?.machineOverridableValue || 'http://localhost:11434';
    }

    private getModelId(): string {
        return this.configurationService.inspect<string>('github.copilot.chat.languageModelProviders.ollama.modelId')?.machineOverridableValue || '';
    }

    async isAvailable(cancellationToken: CancellationToken): Promise<boolean> {
        const baseUrl = this.getBaseUrl();
        try {
            // Attempt to hit a lightweight Ollama endpoint (e.g., /api/tags or just /)
            const response = await this.fetcherService.fetch(`${baseUrl}/api/tags`, { method: 'GET' }, cancellationToken);
            return response.ok;
        } catch (error) {
            console.error('Ollama provider isAvailable check failed:', error);
            return false;
        }
    }

    async getCapabilities(cancellationToken: CancellationToken): Promise<LanguageModelCapabilities> {
        // TODO: Ideally, fetch /api/show for the configured modelId to get actual context window.
        // For now, using a common default.
        // Tool usage is generally not supported by Ollama's standard API in an OpenAI-compatible way.
        return {
            streaming: true,
            maxContextTokens: 4096, // Common default, should be made dynamic
            toolUsage: false,
            supportedModels: [] // Can be populated dynamically by /api/tags if desired
        };
    }

    async* streamChatCompletions(request: LanguageModelChatRequest, cancellationToken: CancellationToken): AsyncIterable<LanguageModelChatResponseChunk> {
        const modelId = this.getModelId();
        if (!modelId) {
            throw new LanguageModelError('Ollama model ID is not configured. Please set it in the extension settings.', this.id);
        }
        const baseUrl = this.getBaseUrl();
        const endpoint = `${baseUrl}/api/chat`;

        const ollamaMessages = request.messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'), // Ollama uses 'user', 'assistant', 'system'
            content: m.content,
            // TODO: Handle images if Ollama provider/model supports it
        }));

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const body: Record<string, any> = {
            model: modelId,
            messages: ollamaMessages,
            stream: true,
            options: { // Common Ollama options
                temperature: request.temperature,
                num_predict: request.maxTokens, // num_predict is often used for maxTokens
                stop: request.stop,
                // TODO: Map other options if available/relevant, e.g. top_p, top_k from request if we add them
            }
        };

        // Remove undefined properties from body.options and body itself
        if (body.options) {
            Object.keys(body.options).forEach(key => body.options[key] === undefined && delete body.options[key]);
            if (Object.keys(body.options).length === 0) {
                delete body.options;
            }
        }
        Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);


        const fetchOptions: IFetchOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: cancellationToken,
            stream: true
        };

        let response: IFetchResponse;
        try {
            response = await this.fetcherService.fetch(endpoint, fetchOptions, cancellationToken);
        } catch (error: any) {
            this.logService.error(`[${this.id}] Network error calling Ollama:`, error);
            throw new LanguageModelError(`Network error: ${error.message || 'Unknown network error'}`, this.id, error);
        }

        if (!response.ok) {
            let errorBodyText = `Ollama API Error: ${response.status}`;
            try {
                const errorData = await response.json() as { error?: string };
                if (errorData.error) {
                    errorBodyText += ` - ${errorData.error}`;
                }
                this.logService.error(`[${this.id}] Ollama API error: ${response.status}`, errorData);
                throw new LanguageModelError(errorBodyText, this.id, errorData, String(response.status));
            } catch (e: any) {
                 this.logService.error(`[${this.id}] Failed to parse Ollama error response:`, e);
                throw new LanguageModelError(errorBodyText, this.id, e, String(response.status));
            }
        }

        if (!response.body) {
            throw new LanguageModelError('No response body from Ollama stream.', this.id);
        }

        const responseBodyStream = response.body as unknown as Readable;

        for await (const chunk of streamToAsyncIterable(responseBodyStream)) {
            if (cancellationToken.isCancellationRequested) {
                if (typeof (responseBodyStream as any).destroy === 'function') {
                    (responseBodyStream as any).destroy();
                }
                this.logService.info(`[${this.id}] Ollama stream cancelled.`);
                throw new LanguageModelError('Stream cancelled by user.', this.id);
            }

            // Ollama streams JSON objects separated by newlines
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    const responseChunk: LanguageModelChatResponseChunk = {
                        content: parsed.message?.content || undefined,
                        role: parsed.message?.role || 'assistant', // Default to assistant
                        finishReason: parsed.done ? 'stop' : undefined, // Ollama's `done` field indicates end of stream
                        usage: parsed.done && (parsed.prompt_eval_count || parsed.eval_count) ? {
                            prompt_tokens: parsed.prompt_eval_count || 0,
                            completion_tokens: parsed.eval_count || 0,
                            total_tokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0)
                        } as APIUsage : undefined
                    };
                    yield responseChunk;

                    if (parsed.done) {
                        return; // End of stream
                    }
                } catch (e: any) {
                    this.logService.warn(`[${this.id}] Failed to parse Ollama stream data chunk: '${line}'`, e);
                }
            }
        }
    }
}
