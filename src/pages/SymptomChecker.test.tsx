import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SymptomChecker from './SymptomChecker';
import { BrowserRouter } from 'react-router-dom';

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock the AI service
vi.mock('../lib/gemini', () => ({
    getGeminiResponse: vi.fn(() => Promise.resolve({
        text: 'Mock AI Response',
        options: ['Option A', 'Option B']
    })),
}));

describe('SymptomChecker Component', () => {
    it('renders the chat interface', () => {
        render(
            <BrowserRouter>
                <SymptomChecker />
            </BrowserRouter>
        );
        expect(screen.getByText(/Symptom Checker/i)).toBeInTheDocument();
        // Input field is not present initially, only buttons
        expect(screen.getByRole('button', { name: /Headache/i })).toBeInTheDocument();
    });

    it('displays user message and AI response', async () => {
        render(
            <BrowserRouter>
                <SymptomChecker />
            </BrowserRouter>
        );

        // Find the "Headache" button and click it
        const headacheButton = screen.getByRole('button', { name: /Headache/i });
        fireEvent.click(headacheButton);

        // Check user message appears (it adds the option text as a user message)
        expect(screen.getByText('Headache')).toBeInTheDocument();

        // Check AI response appears (after async)
        await waitFor(() => {
            expect(screen.getByText('Mock AI Response')).toBeInTheDocument();
        });
    });
});
