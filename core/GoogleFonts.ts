const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2';

// Popular fonts list - these will be available in the font picker
export const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Raleway', 'Oswald', 'Playfair Display', 'Merriweather',
    'Source Sans Pro', 'Ubuntu', 'Nunito', 'Work Sans', 'DM Sans',
    'Quicksand', 'Rubik', 'Karla', 'Cabin', 'Archivo',
    'Bebas Neue', 'Pacifico', 'Dancing Script', 'Permanent Marker',
    'Abril Fatface', 'Righteous', 'Alfa Slab One', 'Lobster',
    'Anton', 'Comfortaa', 'Titan One', 'Fredoka One',
    'Georgia', 'Times New Roman', 'Courier New', 'Arial', 'Verdana',
    'Comic Sans MS', 'Impact', 'Trebuchet MS'
];

const loadedFonts = new Set<string>();

export async function loadGoogleFont(fontFamily: string): Promise<boolean> {
    // Skip system fonts
    const systemFonts = ['Georgia', 'Times New Roman', 'Courier New', 'Arial', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'sans-serif'];
    if (systemFonts.includes(fontFamily)) return true;

    if (loadedFonts.has(fontFamily)) return true;

    try {
        const encodedFamily = fontFamily.replace(/ /g, '+');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${GOOGLE_FONTS_CSS_URL}?family=${encodedFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);

        // Wait for font to actually load
        await document.fonts.load(`400 16px "${fontFamily}"`);
        loadedFonts.add(fontFamily);
        return true;
    } catch (err) {
        console.warn(`Failed to load font: ${fontFamily}`, err);
        return false;
    }
}

export function preloadPopularFonts() {
    // Preload the first 10 popular fonts on app start
    const popular = GOOGLE_FONTS.slice(0, 10);
    popular.forEach(font => loadGoogleFont(font));
}
