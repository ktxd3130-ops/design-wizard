import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './agents/**/*.{js,ts,jsx,tsx,mdx}',
        './core/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: 'var(--brand-primary)',
                    'primary-hover': 'var(--brand-primary-hover)',
                    accent: 'var(--brand-accent)',
                    surface: 'var(--brand-surface)',
                }
            }
        },
    },
    plugins: [],
}
export default config
