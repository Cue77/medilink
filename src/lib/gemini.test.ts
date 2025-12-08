import { describe, it, expect, vi } from 'vitest';

// Use vi.hoisted to define mocks
const mocks = vi.hoisted(() => ({
    sendMessage: vi.fn(),
}));

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: () => ({
                    startChat: () => ({
                        sendMessage: mocks.sendMessage,
                    }),
                }),
            };
        }),
    };
});

// Import the module AFTER the mock is defined
import { getGeminiResponse } from './gemini';

describe('getGeminiResponse', () => {
    it('returns the text response from the AI', async () => {
        // Setup mock success
        mocks.sendMessage.mockResolvedValue({
            response: {
                text: () => 'You should see a GP.',
            },
        });

        const result = await getGeminiResponse([], 'I have a headache');
        expect(result.text).toBe('You should see a GP.');
        expect(mocks.sendMessage).toHaveBeenCalledWith('I have a headache');
    });

    it('handles errors gracefully', async () => {
        // Setup mock failure
        mocks.sendMessage.mockRejectedValue(new Error('API Error'));

        const result = await getGeminiResponse([], 'I have a headache');
        expect(result.text).toContain('trouble');
    });
});
