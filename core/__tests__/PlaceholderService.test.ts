import { describe, it, expect } from 'vitest';
import { PlaceholderService, MOCK_USER_PROFILE } from '../services/PlaceholderService';

describe('PlaceholderService', () => {
    it('replaces known placeholder tokens in text objects', () => {
        const input = [{ type: 'textbox', text: 'Hello {{USER_NAME}}' }];
        const result = PlaceholderService.hydrateTemplate(input);
        expect(result[0].text).toBe('Hello Kendall Dale');
    });

    it('replaces multiple tokens in the same text', () => {
        const input = [{ type: 'text', text: '{{COMPANY}} - {{PHONE}}' }];
        const result = PlaceholderService.hydrateTemplate(input);
        expect(result[0].text).toBe('HC Brands - 1-800-272-3729');
    });

    it('does not modify non-text objects', () => {
        const input = [{ type: 'image', src: '{{USER_NAME}}' }];
        const result = PlaceholderService.hydrateTemplate(input);
        expect(result[0].src).toBe('{{USER_NAME}}');
    });

    it('leaves text without tokens unchanged', () => {
        const input = [{ type: 'textbox', text: 'No placeholders here' }];
        const result = PlaceholderService.hydrateTemplate(input);
        expect(result[0].text).toBe('No placeholders here');
    });
});
