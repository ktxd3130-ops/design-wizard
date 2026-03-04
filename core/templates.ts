// core/templates.ts

export interface ProductTemplate {
    id: string;
    name: string;
    width: number; // in pixels
    height: number; // in pixels
    category: string;
    image?: string;
    payload?: any; // Fabric.js JSON representation of the predefined layout
}

export interface TemplateCategory {
    title: string;
    items: ProductTemplate[];
}

// Helper to generate IDs
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export const HC_BRANDS_CATALOG: TemplateCategory[] = [
    {
        title: "Rubber Stamps",
        items: [
            { id: generateId('stamp'), name: "Self-inking stamps", width: 400, height: 200, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Pre-inked stamps", width: 400, height: 200, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Wood handle stamps", width: 400, height: 400, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Address stamps", width: 600, height: 250, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Return address stamps", width: 500, height: 200, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Signature stamps", width: 600, height: 200, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Logo stamps", width: 500, height: 500, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Teacher stamps", width: 400, height: 400, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Inspection stamps", width: 200, height: 200, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Date stamps", width: 300, height: 150, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Number stamps", width: 300, height: 150, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Notary stamps", width: 500, height: 250, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Corporate seal stamps", width: 400, height: 400, category: "Rubber Stamps" },
            { id: generateId('stamp'), name: "Specialty stamps", width: 400, height: 400, category: "Rubber Stamps" },
        ]
    },
    {
        title: "Notary & Professional Supplies",
        items: [
            { id: generateId('notary'), name: "Notary stamps", width: 500, height: 250, category: "Notary" },
            { id: generateId('notary'), name: "Notary embossers", width: 400, height: 400, category: "Notary" },
            { id: generateId('notary'), name: "Notary seals", width: 400, height: 400, category: "Notary" },
            { id: generateId('notary'), name: "Professional seals", width: 400, height: 400, category: "Notary" },
        ]
    },
    {
        title: "Name Tags & ID",
        items: [
            { id: generateId('id'), name: "Magnetic name tags", width: 600, height: 200, category: "ID" },
            { id: generateId('id'), name: "Pin name badges", width: 600, height: 200, category: "ID" },
            { id: generateId('id'), name: "Reusable name tags", width: 600, height: 200, category: "ID" },
            { id: generateId('id'), name: "Engraved name badges", width: 600, height: 200, category: "ID" },
            { id: generateId('id'), name: "Full-color printed badges", width: 600, height: 200, category: "ID" },
            { id: generateId('id'), name: "Employee badges", width: 400, height: 600, category: "ID" },
            { id: generateId('id'), name: "Photo ID badges", width: 400, height: 600, category: "ID" },
            { id: generateId('id'), name: "Visitor badges", width: 400, height: 600, category: "ID" },
            { id: generateId('id'), name: "Custom badge holders", width: 450, height: 650, category: "ID" },
        ]
    },
    {
        title: "Custom Signs",
        items: [
            { id: generateId('sign'), name: "Office door signs", width: 800, height: 200, category: "Signs" },
            { id: generateId('sign'), name: "Desk name plates", width: 800, height: 200, category: "Signs" },
            { id: generateId('sign'), name: "Cubicle name plates", width: 800, height: 200, category: "Signs" },
            { id: generateId('sign'), name: "Room signs", width: 600, height: 600, category: "Signs" },
            { id: generateId('sign'), name: "Wayfinding signs", width: 600, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Directional signs", width: 800, height: 400, category: "Signs" },
            { id: generateId('sign'), name: "ADA braille signs", width: 600, height: 600, category: "Signs" },
            { id: generateId('sign'), name: "Restroom ADA signs", width: 600, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Exit ADA signs", width: 800, height: 400, category: "Signs" },
            { id: generateId('sign'), name: "Accessibility signs", width: 600, height: 600, category: "Signs" },
            { id: generateId('sign'), name: "OSHA safety signs", width: 800, height: 1200, category: "Signs" },
            { id: generateId('sign'), name: "Warning signs", width: 800, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Hazard signs", width: 800, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Aluminum signs", width: 1200, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "PVC signs", width: 1200, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Metal signs", width: 1200, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Property signs", width: 1200, height: 800, category: "Signs" },
            { id: generateId('sign'), name: "Real estate signs", width: 1200, height: 800, category: "Signs" },
        ]
    },
    {
        title: "Yard Signs",
        items: [
            {
                id: generateId('yard'),
                name: "Real estate yard signs",
                width: 1200,
                height: 900,
                category: "Yard Signs",
                image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                payload: {
                    "version": "6.0.0",
                    "objects": [
                        {
                            "type": "rect",
                            "left": 0,
                            "top": 0,
                            "width": 1200,
                            "height": 900,
                            "fill": "#E53E3E",
                            "selectable": false,
                            "evented": false
                        },
                        {
                            "type": "textbox",
                            "left": 600,
                            "top": 350,
                            "width": 1000,
                            "text": "FOR SALE",
                            "fontSize": 200,
                            "fontWeight": "bold",
                            "fontFamily": "Inter",
                            "fill": "#ffffff",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "textbox",
                            "left": 600,
                            "top": 600,
                            "width": 1000,
                            "text": "555-0198",
                            "fontSize": 120,
                            "fontWeight": "normal",
                            "fontFamily": "Inter",
                            "fill": "#ffffff",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        }
                    ]
                }
            },
            { id: generateId('yard'), name: "Contractor yard signs", width: 1200, height: 900, category: "Yard Signs" },
            { id: generateId('yard'), name: "Political yard signs", width: 1200, height: 900, category: "Yard Signs" },
            { id: generateId('yard'), name: "Event yard signs", width: 1200, height: 900, category: "Yard Signs" },
            { id: generateId('yard'), name: "Custom yard signs", width: 1200, height: 900, category: "Yard Signs" },
            { id: generateId('yard'), name: "Coroplast yard signs", width: 1200, height: 900, category: "Yard Signs" },
            { id: generateId('yard'), name: "H-stake yard signs", width: 1200, height: 900, category: "Yard Signs" },
        ]
    },
    {
        title: "Wall Graphics & Décor",
        items: [
            { id: generateId('wall'), name: "Wall decals", width: 1000, height: 1000, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Wall stickers", width: 800, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Vinyl wall graphics", width: 1200, height: 1200, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Wall murals", width: 2400, height: 1200, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Window murals", width: 2400, height: 1200, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Kids wall decals", width: 800, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Business wall decals", width: 1200, height: 1200, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Educational wall decals", width: 1200, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Sports wall decals", width: 800, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Animal wall decals", width: 800, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Space themed decals", width: 800, height: 800, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Die-cut wall decals", width: 1000, height: 1000, category: "Wall Graphics" },
            { id: generateId('wall'), name: "Wallpaper decal sets", width: 1200, height: 2400, category: "Wall Graphics" },
        ]
    },
    {
        title: "Stickers & Decals",
        items: [
            { id: generateId('sticker'), name: "Die-cut stickers", width: 400, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Kiss-cut stickers", width: 400, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Transfer vinyl decals", width: 600, height: 300, category: "Stickers" },
            { id: generateId('sticker'), name: "Window decals", width: 800, height: 800, category: "Stickers" },
            { id: generateId('sticker'), name: "Window clings", width: 800, height: 800, category: "Stickers" },
            { id: generateId('sticker'), name: "Static cling stickers", width: 600, height: 600, category: "Stickers" },
            { id: generateId('sticker'), name: "Reflective stickers", width: 400, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Holographic stickers", width: 400, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Glitter stickers", width: 400, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Water bottle stickers", width: 300, height: 300, category: "Stickers" },
            { id: generateId('sticker'), name: "Laptop stickers", width: 400, height: 300, category: "Stickers" },
            { id: generateId('sticker'), name: "Car stickers", width: 600, height: 400, category: "Stickers" },
            { id: generateId('sticker'), name: "Custom sticker sheets", width: 800, height: 1200, category: "Stickers" },
        ]
    },
    {
        title: "Magnets",
        items: [
            { id: generateId('magnet'), name: "Car magnets", width: 1200, height: 600, category: "Magnets" },
            { id: generateId('magnet'), name: "Refrigerator magnets", width: 400, height: 400, category: "Magnets" },
            { id: generateId('magnet'), name: "Business magnets", width: 600, height: 400, category: "Magnets" },
            { id: generateId('magnet'), name: "Promotional magnets", width: 400, height: 400, category: "Magnets" },
            { id: generateId('magnet'), name: "Save-the-date magnets", width: 600, height: 800, category: "Magnets" },
        ]
    },
    {
        title: "Banners & Prints",
        items: [
            { id: generateId('banner'), name: "Vinyl banners", width: 2400, height: 800, category: "Banners" },
            { id: generateId('banner'), name: "Mesh banners", width: 2400, height: 800, category: "Banners" },
            { id: generateId('banner'), name: "Event banners", width: 3600, height: 1200, category: "Banners" },
            { id: generateId('banner'), name: "Retractable banners", width: 1000, height: 2400, category: "Banners" },
        ]
    },
    {
        title: "Promotional Products",
        items: [
            { id: generateId('promo'), name: "Buttons / pinback buttons", width: 200, height: 200, category: "Promo" },
            { id: generateId('promo'), name: "Koozies / drink sleeves", width: 400, height: 400, category: "Promo" },
            { id: generateId('promo'), name: "Promotional giveaways", width: 400, height: 400, category: "Promo" },
            { id: generateId('promo'), name: "Business swag items", width: 600, height: 600, category: "Promo" },
        ]
    },
    {
        title: "Personalized Gifts",
        items: [
            { id: generateId('gift'), name: "Engraved cutting boards", width: 1200, height: 800, category: "Gifts" },
            { id: generateId('gift'), name: "Personalized drinkware", width: 400, height: 800, category: "Gifts" },
            { id: generateId('gift'), name: "Gift plaques", width: 800, height: 1000, category: "Gifts" },
            { id: generateId('gift'), name: "Awards", width: 600, height: 800, category: "Gifts" },
        ]
    }
];
