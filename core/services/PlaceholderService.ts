export const MOCK_USER_PROFILE: Record<string, string> = {
    '{{USER_NAME}}': 'Kendall Dale',
    '{{EMAIL}}': 'contact@example.com',
    '{{PHONE}}': '555-0199',
    '{{COMPANY}}': 'Design Wizard Inc.'
};

export class PlaceholderService {
    /**
     * Integrator: Auto-fill Service
     * Scans incoming template JSON array and replaces mapping keys with live user context data.
     */
    static hydrateTemplate(templateArray: any[]): any[] {
        return templateArray.map(obj => {
            if (obj.type === 'textbox' || obj.type === 'text') {
                let hydratedText = obj.text || '';

                // Replace all known tokens
                Object.entries(MOCK_USER_PROFILE).forEach(([key, value]) => {
                    if (hydratedText.includes(key)) {
                        hydratedText = hydratedText.replace(new RegExp(key, 'g'), value);
                    }
                });

                return { ...obj, text: hydratedText };
            }
            return obj;
        });
    }
}
