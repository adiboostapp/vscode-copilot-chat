import { CancellationToken, ExtensionContext } from 'vscode';
import { LanguageModelChatMessage, LanguageModelChatRequest, LanguageModelChatResponseChunk, LanguageModelCapabilities, ILanguageModelProvider, LanguageModelError } from '../common/languageModelProvider';
import { IVSCodeConfigurationService } from '../../../platform/configuration/common/configuration';
import { APIUsage, OpenAIError, OpenAIErrorResponse } from '../../../platform/networking/common/openai'; // Assuming this path is correct, Added OpenAIError, OpenAIErrorResponse
import { IExtensionContext } from '../../../platform/extContext/common/extensionContext';
import { IFetcherService, IFetchOptions, IFetchResponse } from '../../../platform/networking/common/fetcherService'; // Import IFetcherService
import { streamToAsyncIterable } from '../../../util/common/async'; // Utility to convert Node.js stream to AsyncIterable
import { Readable } from 'stream';
import { ILogService } from '../../../platform/log/common/logService';

const OPENAI_USER_PROVIDER_ID = 'openai-user';
const OPENAI_API_KEY_SECRET_KEY = 'openaiUser.apiKey'; // Key for VS Code SecretStorage

export class OpenAIUserLanguageModelProvider implements ILanguageModelProvider {
    readonly id: string = OPENAI_USER_PROVIDER_ID;
    readonly displayName: string = 'OpenAI (User Key)';

    constructor(
        @IVSCodeConfigurationService private readonly configurationService: IVSCodeConfigurationService,
        @IExtensionContext private readonly extensionContext: IExtensionContext,
        @IFetcherService private readonly fetcherService: IFetcherService, // Inject IFetcherService
        @ILogService private readonly logService: ILogService
    ) {}

    private async getApiKey(cancellationToken: CancellationToken): Promise<string | undefined> {
        let apiKey = await this.extensionContext.secrets.get(OPENAI_API_KEY_SECRET_KEY);

        if (!apiKey) {
            // Fallback: Check configuration if not in SecretStorage (e.g., for migration or if user set it there directly)
            const configApiKey = this.configurationService.inspect<string>(`github.copilot.chat.languageModelProviders.openaiUser.apiKey`)?.machineOverridableValue;
            if (configApiKey) {
                // If found in config, store it in SecretStorage and clear from config for security.
                // Note: Clearing from config requires a command or different flow, as providers shouldn't directly write global/workspace settings.
                // For now, we'll just use it and recommend users move it.
                // A better approach would be a dedicated command to set/migrate the API key.
                // await this.extensionContext.secrets.store(OPENAI_API_KEY_SECRET_KEY, configApiKey);
                // Consider logging a recommendation to move the key.
                apiKey = configApiKey;
            }
        }
        return apiKey;
    }

    async isAvailable(cancellationToken: CancellationToken): Promise<boolean> {
        const apiKey = await this.getApiKey(cancellationToken);
        // TODO: Potentially validate the key with a lightweight API call to OpenAI.
        return !!apiKey;
    }

    async getCapabilities(cancellationToken: CancellationToken): Promise<LanguageModelCapabilities> {
        // These are typical capabilities for models like gpt-4 or gpt-3.5-turbo.
        // maxContextTokens might need to be dynamic based on the selected modelId.
        return {
            streaming: true,
            maxContextTokens: 8192, // Default, can be made dynamic later
            toolUsage: true, // OpenAI models generally support tool/function calling
            supportedModels: [ // Examples
                'gpt-4-turbo-preview',
                'gpt-4',
                'gpt-3.5-turbo',
                'gpt-3.5-turbo-16k'
            ]
        };
    }

    async* streamChatCompletions(request: LanguageModelChatRequest, cancellationToken: CancellationToken): AsyncIterable<LanguageModelChatResponseChunk> {
        const apiKey = await this.getApiKey(cancellationToken);
        if (!apiKey) {
            throw new LanguageModelError('OpenAI API key is not configured. Please set it in the extension settings or use a dedicated command to set it.', this.id);
        }

        const modelId = this.configurationService.inspect<string>(`github.copilot.chat.languageModelProviders.openaiUser.modelId`)?.machineOverridableValue || 'gpt-3.5-turbo'; // Default model
        const apiBaseUrl = this.configurationService.inspect<string>(`github.copilot.chat.languageModelProviders.openaiUser.apiBaseUrl`)?.machineOverridableValue || 'https://api.openai.com/v1';

        const endpoint = `${apiBaseUrl}/chat/completions`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        const body: Record<string, any> = {
            model: request.modelId || modelId,
            messages: request.messages,
            stream: true,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            stop: request.stop,
            user: request.user
        };

        // Remove undefined properties from body
        Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

        const fetchOptions: IFetchOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: cancellationToken,
            stream: true // Important for IFetcherService to handle streaming
        };

        let response: IFetchResponse;
        try {
            response = await this.fetcherService.fetch(endpoint, fetchOptions, cancellationToken);
        } catch (error: any) {
            this.logService.error(`[${this.id}] Network error calling OpenAI:`, error);
            throw new LanguageModelError(`Network error: ${error.message || 'Unknown network error'}`, this.id, error);
        }

        if (!response.ok) {
            let errorBodyText = 'Unknown error';
            try {
                errorBodyText = await response.text();
                const errorJson = JSON.parse(errorBodyText) as OpenAIErrorResponse;
                const errorMessage = errorJson.error?.message || errorBodyText;
                this.logService.error(`[${this.id}] OpenAI API error: ${response.status}`, errorMessage, errorJson);
                throw new LanguageModelError(`API Error: ${response.status} ${errorMessage}`, this.id, errorJson, String(response.status));
            } catch (e: any) {
                this.logService.error(`[${this.id}] Failed to parse OpenAI error response:`, errorBodyText, e);
                throw new LanguageModelError(`API Error: ${response.status} - ${errorBodyText}`, this.id, e, String(response.status));
            }
        }

        if (!response.body) {
            throw new LanguageModelError('No response body from OpenAI stream.', this.id);
        }

        // Convert Node.js Readable stream from fetcherService to AsyncIterable
        const responseBodyStream = response.body as unknown as Readable;

        for await (const chunk of streamToAsyncIterable(responseBodyStream)) {
            if (cancellationToken.isCancellationRequested) {
                // Ensure the stream is properly closed/destroyed if cancellation happens mid-stream.
                // The `fetch` signal should handle aborting the request, but cleaning up the stream reader is good practice.
                if (typeof (responseBodyStream as any).destroy === 'function') {
                    (responseBodyStream as any).destroy();
                }
                this.logService.info(`[${this.id}] OpenAI stream cancelled.`);
                throw new LanguageModelError('Stream cancelled by user.', this.id);
            }

            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataContent = line.substring('data: '.length).trim();
                    if (dataContent === '[DONE]') {
                        // Stream finished. Sometimes OpenAI sends usage stats in a final non-data: [DONE] chunk or a separate header.
                        // For now, we assume usage might come with the last data chunk if `finish_reason` is present.
                        return;
                    }
                    if (dataContent) {
                        try {
                            const parsed = JSON.parse(dataContent);
                            if (parsed.choices && parsed.choices.length > 0) {
                                const choice = parsed.choices[0];
                                const responseChunk: LanguageModelChatResponseChunk = {
                                    content: choice.delta?.content || undefined,
                                    role: choice.delta?.role || undefined,
                                    finishReason: choice.finish_reason || undefined,
                                    // OpenAI often sends usage in the *last* chunk of a non-streaming response,
                                    // or sometimes as a separate header/field in streaming.
                                    // For streaming, `usage` is typically on the *final* data event if `finish_reason` is set.
                                    // Or sometimes in an `x-request-id` header or similar on the main response (not accessible here directly per chunk).
                                    // Let's assume for now if finish_reason is present, and 'usage' exists in the parsed chunk, we use it.
                                    // This part needs to be verified against actual OpenAI streaming behavior for token counts.
                                    usage: parsed.usage || choice.usage || undefined // Check root and choice for usage
                                };
                                yield responseChunk;
                            }
                        } catch (e: any) {
                            this.logService.warn(`[${this.id}] Failed to parse OpenAI stream data chunk: '${dataContent}'`, e);
                            // Decide if we should throw or just skip this malformed chunk
                        }
                    }
                }
            }
        }
    }
}
