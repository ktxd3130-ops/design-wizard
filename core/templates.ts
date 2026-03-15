// core/templates.ts

export interface ProductTemplate {
    id: string;
    name: string;
    width: number;
    height: number;
    category: string;
    image?: string;
    payload?: any;
}

export interface TemplateCategory {
    title: string;
    items: ProductTemplate[];
}

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${++idCounter}`;

// ── Template Payload Generators ─────────────────────────────

function stampPayload(w: number, h: number, text: string, subtext?: string) {
    const isRound = Math.abs(w - h) < 50;
    const borderInset = Math.min(w, h) * 0.06;
    const objs: any[] = [
        { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: isRound ? w / 2 : 8, ry: isRound ? h / 2 : 8 },
        { type: "Rect", left: borderInset, top: borderInset, width: w - borderInset * 2, height: h - borderInset * 2, fill: "transparent", stroke: "#1a1a2e", strokeWidth: Math.max(2, Math.min(w, h) * 0.02), selectable: false, evented: false, rx: isRound ? (w - borderInset * 2) / 2 : 4, ry: isRound ? (h - borderInset * 2) / 2 : 4 },
        { type: "Textbox", left: w / 2, top: subtext ? h * 0.38 : h / 2, width: w * 0.7, text: text.toUpperCase(), fontSize: Math.min(w, h) * 0.14, fontWeight: "bold", fontFamily: "Inter", fill: "#1a1a2e", textAlign: "center", originX: "center", originY: "center" },
    ];
    if (subtext) {
        objs.push({ type: "Textbox", left: w / 2, top: h * 0.62, width: w * 0.65, text: subtext, fontSize: Math.min(w, h) * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#555555", textAlign: "center", originX: "center", originY: "center" });
    }
    return { version: "6.0.0", objects: objs };
}

function notarySealPayload(w: number, h: number, text: string) {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.42;
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#f8f6f0", selectable: false, evented: false },
            { type: "Circle", left: cx, top: cy, radius: r, fill: "transparent", stroke: "#1a365d", strokeWidth: 4, originX: "center", originY: "center", selectable: false, evented: false },
            { type: "Circle", left: cx, top: cy, radius: r * 0.88, fill: "transparent", stroke: "#1a365d", strokeWidth: 2, originX: "center", originY: "center", selectable: false, evented: false },
            { type: "Textbox", left: cx, top: cy - r * 0.2, width: r * 1.4, text: "NOTARY PUBLIC", fontSize: r * 0.18, fontWeight: "bold", fontFamily: "Inter", fill: "#1a365d", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: cx, top: cy + r * 0.05, width: r * 1.2, text: "STATE OF", fontSize: r * 0.1, fontWeight: "normal", fontFamily: "Inter", fill: "#4a5568", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: cx, top: cy + r * 0.25, width: r * 1.4, text: "YOUR NAME", fontSize: r * 0.16, fontWeight: "bold", fontFamily: "Inter", fill: "#1a365d", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: cx, top: cy + r * 0.5, width: r * 1.2, text: "Commission #000000", fontSize: r * 0.09, fontWeight: "normal", fontFamily: "Inter", fill: "#718096", textAlign: "center", originX: "center", originY: "center" },
        ]
    };
}

function badgePayload(w: number, h: number, name: string, isVertical: boolean) {
    if (isVertical) {
        return {
            version: "6.0.0",
            objects: [
                { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: 12, ry: 12 },
                { type: "Rect", left: 0, top: 0, width: w, height: h * 0.2, fill: "#2563eb", selectable: false, evented: false, rx: 12, ry: 0 },
                { type: "Textbox", left: w / 2, top: h * 0.1, width: w * 0.8, text: "COMPANY NAME", fontSize: w * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                { type: "Rect", left: w / 2, top: h * 0.42, width: w * 0.4, height: w * 0.4, fill: "#e2e8f0", rx: w * 0.2, ry: w * 0.2, originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.42, width: w * 0.3, text: "PHOTO", fontSize: w * 0.06, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.66, width: w * 0.8, text: "FIRST LAST", fontSize: w * 0.1, fontWeight: "bold", fontFamily: "Inter", fill: "#1e293b", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.76, width: w * 0.7, text: "Job Title", fontSize: w * 0.065, fontWeight: "normal", fontFamily: "Inter", fill: "#64748b", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.88, width: w * 0.6, text: "ID: 000000", fontSize: w * 0.055, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "center", originX: "center", originY: "center" },
            ]
        };
    }
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: 8, ry: 8 },
            { type: "Rect", left: 0, top: 0, width: w, height: h * 0.06, fill: "#2563eb", selectable: false, evented: false },
            { type: "Rect", left: w * 0.04, top: h * 0.2, width: h * 0.55, height: h * 0.55, fill: "#e2e8f0", rx: 6, ry: 6, selectable: false, evented: false },
            { type: "Textbox", left: w * 0.04 + h * 0.275, top: h * 0.47, width: h * 0.4, text: "PHOTO", fontSize: h * 0.1, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w * 0.55, top: h * 0.32, width: w * 0.42, text: "FIRST LAST", fontSize: h * 0.18, fontWeight: "bold", fontFamily: "Inter", fill: "#1e293b", textAlign: "left", originX: "center", originY: "center" },
            { type: "Textbox", left: w * 0.55, top: h * 0.55, width: w * 0.42, text: "Job Title / Department", fontSize: h * 0.1, fontWeight: "normal", fontFamily: "Inter", fill: "#64748b", textAlign: "left", originX: "center", originY: "center" },
            { type: "Textbox", left: w * 0.55, top: h * 0.72, width: w * 0.42, text: "company@email.com", fontSize: h * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "left", originX: "center", originY: "center" },
        ]
    };
}

function signPayload(w: number, h: number, title: string, style: 'office' | 'safety' | 'ada' | 'directional' | 'property') {
    switch (style) {
        case 'safety':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: 4, ry: 4 },
                    { type: "Rect", left: 0, top: 0, width: w, height: h * 0.28, fill: "#dc2626", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.14, width: w * 0.85, text: "DANGER", fontSize: h * 0.16, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Rect", left: w * 0.06, top: h * 0.34, width: w * 0.88, height: h * 0.58, fill: "transparent", stroke: "#dc2626", strokeWidth: 3, selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.5, width: w * 0.75, text: title.toUpperCase(), fontSize: h * 0.06, fontWeight: "bold", fontFamily: "Inter", fill: "#1a1a1a", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.7, width: w * 0.75, text: "Authorized Personnel Only\nFollow All Safety Procedures", fontSize: h * 0.04, fontWeight: "normal", fontFamily: "Inter", fill: "#4a4a4a", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        case 'ada':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1e3a5f", selectable: false, evented: false, rx: 8, ry: 8 },
                    { type: "Rect", left: w * 0.04, top: h * 0.04, width: w * 0.92, height: h * 0.92, fill: "transparent", stroke: "#ffffff", strokeWidth: 2, selectable: false, evented: false, rx: 4, ry: 4 },
                    { type: "Textbox", left: w / 2, top: h * 0.35, width: w * 0.75, text: title.toUpperCase(), fontSize: Math.min(w, h) * 0.12, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.58, width: w * 0.6, text: "⠃⠗⠁⠊⠇⠇⠑", fontSize: Math.min(w, h) * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center", opacity: 0.7 },
                    { type: "Textbox", left: w / 2, top: h * 0.78, width: w * 0.6, text: "♿", fontSize: Math.min(w, h) * 0.15, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        case 'directional':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1e293b", selectable: false, evented: false, rx: 6, ry: 6 },
                    { type: "Textbox", left: w * 0.08, top: h * 0.25, width: w * 0.5, text: "← Conference Rooms", fontSize: h * 0.11, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "left" },
                    { type: "Textbox", left: w * 0.08, top: h * 0.5, width: w * 0.5, text: "← Restrooms", fontSize: h * 0.11, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "left" },
                    { type: "Textbox", left: w * 0.92, top: h * 0.25, width: w * 0.5, text: "Lobby →", fontSize: h * 0.11, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "right", originX: "right" },
                    { type: "Textbox", left: w * 0.92, top: h * 0.5, width: w * 0.5, text: "Elevator →", fontSize: h * 0.11, fontWeight: "normal", fontFamily: "Inter", fill: "#ffffff", textAlign: "right", originX: "right" },
                    { type: "Rect", left: w * 0.06, top: h * 0.78, width: w * 0.88, height: 2, fill: "#475569", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.88, width: w * 0.8, text: "FLOOR 1", fontSize: h * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#94a3b8", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        case 'property':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: 4, ry: 4 },
                    { type: "Rect", left: 0, top: 0, width: w, height: h * 0.35, fill: "#1e40af", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.12, width: w * 0.85, text: "YOUR COMPANY", fontSize: h * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.25, width: w * 0.85, text: title.toUpperCase(), fontSize: h * 0.06, fontWeight: "normal", fontFamily: "Inter", fill: "#bfdbfe", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.52, width: w * 0.8, text: "123 Main Street\nCity, State 00000", fontSize: h * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#374151", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.75, width: w * 0.85, text: "(555) 000-0000", fontSize: h * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#1e40af", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.88, width: w * 0.7, text: "www.yourwebsite.com", fontSize: h * 0.04, fontWeight: "normal", fontFamily: "Inter", fill: "#6b7280", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        default: // office
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1e293b", selectable: false, evented: false, rx: 6, ry: 6 },
                    { type: "Rect", left: w * 0.03, top: h * 0.08, width: 4, height: h * 0.84, fill: "#3b82f6", selectable: false, evented: false },
                    { type: "Textbox", left: w * 0.08, top: h * 0.35, width: w * 0.84, text: "Your Name Here", fontSize: h * 0.22, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "left" },
                    { type: "Textbox", left: w * 0.08, top: h * 0.65, width: w * 0.84, text: "Job Title / Department", fontSize: h * 0.1, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "left" },
                ]
            };
    }
}

function yardSignPayload(w: number, h: number, title: string, style: 'realestate' | 'contractor' | 'political' | 'event' | 'generic') {
    switch (style) {
        case 'realestate':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#dc2626", selectable: false, evented: false },
                    { type: "Rect", left: w * 0.04, top: h * 0.04, width: w * 0.92, height: h * 0.92, fill: "transparent", stroke: "#ffffff", strokeWidth: 6, selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.8, text: "FOR SALE", fontSize: h * 0.2, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.55, width: w * 0.7, text: "REALTY GROUP", fontSize: h * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#fecaca", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.75, width: w * 0.8, text: "(555) 000-0198", fontSize: h * 0.12, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        case 'contractor':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#f59e0b", selectable: false, evented: false },
                    { type: "Rect", left: 0, top: 0, width: w, height: h * 0.15, fill: "#000000", selectable: false, evented: false },
                    { type: "Rect", left: 0, top: h * 0.85, width: w, height: h * 0.15, fill: "#000000", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.075, width: w * 0.9, text: "LICENSED & INSURED", fontSize: h * 0.06, fontWeight: "bold", fontFamily: "Inter", fill: "#f59e0b", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.35, width: w * 0.85, text: "YOUR COMPANY", fontSize: h * 0.14, fontWeight: "bold", fontFamily: "Inter", fill: "#000000", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.55, width: w * 0.8, text: "Roofing • Siding • Windows", fontSize: h * 0.055, fontWeight: "normal", fontFamily: "Inter", fill: "#451a03", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.72, width: w * 0.85, text: "(555) 000-0000", fontSize: h * 0.1, fontWeight: "bold", fontFamily: "Inter", fill: "#000000", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.925, width: w * 0.9, text: "FREE ESTIMATES • www.yoursite.com", fontSize: h * 0.045, fontWeight: "bold", fontFamily: "Inter", fill: "#f59e0b", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        case 'political':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1e3a5f", selectable: false, evented: false },
                    { type: "Rect", left: 0, top: 0, width: w, height: h * 0.08, fill: "#dc2626", selectable: false, evented: false },
                    { type: "Rect", left: 0, top: h * 0.92, width: w, height: h * 0.08, fill: "#dc2626", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.22, width: w * 0.85, text: "VOTE", fontSize: h * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#fbbf24", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                    { type: "Textbox", left: w / 2, top: h * 0.45, width: w * 0.9, text: "CANDIDATE\nNAME", fontSize: h * 0.15, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.75, width: w * 0.75, text: "FOR CITY COUNCIL", fontSize: h * 0.06, fontWeight: "bold", fontFamily: "Inter", fill: "#93c5fd", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                ]
            };
        case 'event':
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#7c3aed", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.15, width: w * 0.8, text: "★ ANNUAL ★", fontSize: h * 0.06, fontWeight: "bold", fontFamily: "Inter", fill: "#e9d5ff", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
                    { type: "Textbox", left: w / 2, top: h * 0.38, width: w * 0.9, text: "EVENT\nNAME", fontSize: h * 0.16, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Rect", left: w * 0.15, top: h * 0.6, width: w * 0.7, height: 2, fill: "#a78bfa", selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.7, width: w * 0.8, text: "SATURDAY, MONTH 00\n10:00 AM - 4:00 PM", fontSize: h * 0.055, fontWeight: "normal", fontFamily: "Inter", fill: "#ddd6fe", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.88, width: w * 0.8, text: "123 Venue St • City, State", fontSize: h * 0.04, fontWeight: "normal", fontFamily: "Inter", fill: "#c4b5fd", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
        default:
            return {
                version: "6.0.0",
                objects: [
                    { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#0ea5e9", selectable: false, evented: false },
                    { type: "Rect", left: w * 0.03, top: h * 0.03, width: w * 0.94, height: h * 0.94, fill: "transparent", stroke: "#ffffff", strokeWidth: 4, selectable: false, evented: false },
                    { type: "Textbox", left: w / 2, top: h * 0.35, width: w * 0.85, text: "YOUR MESSAGE", fontSize: h * 0.14, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.55, width: w * 0.7, text: "Additional details here", fontSize: h * 0.06, fontWeight: "normal", fontFamily: "Inter", fill: "#e0f2fe", textAlign: "center", originX: "center", originY: "center" },
                    { type: "Textbox", left: w / 2, top: h * 0.78, width: w * 0.85, text: "(555) 000-0000 • yoursite.com", fontSize: h * 0.05, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                ]
            };
    }
}

function wallGraphicPayload(w: number, h: number, title: string) {
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#faf5ff", selectable: false, evented: false },
            { type: "Rect", left: w * 0.05, top: h * 0.05, width: w * 0.9, height: h * 0.9, fill: "transparent", stroke: "#e9d5ff", strokeWidth: 2, strokeDashArray: [10, 5], selectable: false, evented: false },
            { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.7, text: "YOUR", fontSize: Math.min(w, h) * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#a78bfa", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { type: "Textbox", left: w / 2, top: h * 0.45, width: w * 0.8, text: "DESIGN", fontSize: Math.min(w, h) * 0.18, fontWeight: "bold", fontFamily: "Inter", fill: "#6d28d9", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.58, width: w * 0.7, text: "HERE", fontSize: Math.min(w, h) * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#a78bfa", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { type: "Rect", left: w * 0.3, top: h * 0.68, width: w * 0.4, height: 2, fill: "#c4b5fd", selectable: false, evented: false },
            { type: "Textbox", left: w / 2, top: h * 0.78, width: w * 0.6, text: title, fontSize: Math.min(w, h) * 0.04, fontWeight: "normal", fontFamily: "Inter", fill: "#8b5cf6", textAlign: "center", originX: "center", originY: "center" },
        ]
    };
}

function stickerPayload(w: number, h: number, title: string, colorBg: string, colorText: string) {
    const isRound = Math.abs(w - h) < 50;
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: colorBg, selectable: false, evented: false, rx: isRound ? w / 2 : 16, ry: isRound ? h / 2 : 16 },
            { type: "Textbox", left: w / 2, top: h * 0.4, width: w * 0.7, text: "YOUR\nLOGO", fontSize: Math.min(w, h) * 0.16, fontWeight: "bold", fontFamily: "Inter", fill: colorText, textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.7, width: w * 0.6, text: title, fontSize: Math.min(w, h) * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: colorText, textAlign: "center", originX: "center", originY: "center", opacity: 0.7 },
        ]
    };
}

function magnetPayload(w: number, h: number, title: string, style: 'car' | 'fridge' | 'business' | 'promo' | 'savedate') {
    if (style === 'car') {
        return {
            version: "6.0.0",
            objects: [
                { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: 8, ry: 8 },
                { type: "Rect", left: 0, top: 0, width: w * 0.04, height: h, fill: "#dc2626", selectable: false, evented: false },
                { type: "Rect", left: w * 0.96, top: 0, width: w * 0.04, height: h, fill: "#dc2626", selectable: false, evented: false },
                { type: "Textbox", left: w / 2, top: h * 0.25, width: w * 0.8, text: "YOUR COMPANY", fontSize: h * 0.18, fontWeight: "bold", fontFamily: "Inter", fill: "#1e293b", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.5, width: w * 0.7, text: "Service Description Here", fontSize: h * 0.08, fontWeight: "normal", fontFamily: "Inter", fill: "#64748b", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.75, width: w * 0.85, text: "(555) 000-0000  •  www.yoursite.com", fontSize: h * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#dc2626", textAlign: "center", originX: "center", originY: "center" },
            ]
        };
    }
    if (style === 'savedate') {
        return {
            version: "6.0.0",
            objects: [
                { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#fdf2f8", selectable: false, evented: false, rx: 8, ry: 8 },
                { type: "Rect", left: w * 0.06, top: h * 0.04, width: w * 0.88, height: h * 0.92, fill: "transparent", stroke: "#f9a8d4", strokeWidth: 2, selectable: false, evented: false, rx: 4, ry: 4 },
                { type: "Textbox", left: w / 2, top: h * 0.15, width: w * 0.7, text: "SAVE THE DATE", fontSize: w * 0.07, fontWeight: "bold", fontFamily: "Inter", fill: "#be185d", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { type: "Textbox", left: w / 2, top: h * 0.35, width: w * 0.8, text: "First & First", fontSize: w * 0.12, fontWeight: "bold", fontFamily: "Inter", fill: "#831843", textAlign: "center", originX: "center", originY: "center" },
                { type: "Rect", left: w * 0.2, top: h * 0.46, width: w * 0.6, height: 1, fill: "#f9a8d4", selectable: false, evented: false },
                { type: "Textbox", left: w / 2, top: h * 0.56, width: w * 0.7, text: "Month 00, 2025", fontSize: w * 0.065, fontWeight: "normal", fontFamily: "Inter", fill: "#9d174d", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.7, width: w * 0.7, text: "Venue Name\nCity, State", fontSize: w * 0.045, fontWeight: "normal", fontFamily: "Inter", fill: "#be185d", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.88, width: w * 0.6, text: "Formal Invitation to Follow", fontSize: w * 0.035, fontWeight: "normal", fontFamily: "Inter", fill: "#f472b6", textAlign: "center", originX: "center", originY: "center" },
            ]
        };
    }
    // business / fridge / promo
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#ffffff", selectable: false, evented: false, rx: isSquare(w, h) ? 8 : 6 },
            { type: "Rect", left: 0, top: 0, width: w, height: h * 0.25, fill: "#2563eb", selectable: false, evented: false, rx: 8, ry: 0 },
            { type: "Textbox", left: w / 2, top: h * 0.12, width: w * 0.85, text: "COMPANY NAME", fontSize: Math.min(w, h) * 0.1, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.45, width: w * 0.8, text: title, fontSize: Math.min(w, h) * 0.06, fontWeight: "normal", fontFamily: "Inter", fill: "#374151", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.65, width: w * 0.8, text: "(555) 000-0000", fontSize: Math.min(w, h) * 0.09, fontWeight: "bold", fontFamily: "Inter", fill: "#1e293b", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.82, width: w * 0.7, text: "www.yoursite.com", fontSize: Math.min(w, h) * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#6b7280", textAlign: "center", originX: "center", originY: "center" },
        ]
    };
}

function bannerPayload(w: number, h: number, title: string, isVertical: boolean) {
    if (isVertical) {
        return {
            version: "6.0.0",
            objects: [
                { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#0f172a", selectable: false, evented: false },
                { type: "Rect", left: w * 0.08, top: h * 0.02, width: w * 0.84, height: h * 0.96, fill: "transparent", stroke: "#334155", strokeWidth: 2, selectable: false, evented: false },
                { type: "Textbox", left: w / 2, top: h * 0.12, width: w * 0.7, text: "COMPANY", fontSize: w * 0.12, fontWeight: "bold", fontFamily: "Inter", fill: "#3b82f6", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.75, text: "YOUR\nHEADLINE\nHERE", fontSize: w * 0.14, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                { type: "Rect", left: w * 0.2, top: h * 0.48, width: w * 0.6, height: 3, fill: "#3b82f6", selectable: false, evented: false },
                { type: "Textbox", left: w / 2, top: h * 0.58, width: w * 0.7, text: "Supporting text goes here with more details about your services or event", fontSize: w * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#94a3b8", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.82, width: w * 0.7, text: "(555) 000-0000", fontSize: w * 0.09, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.92, width: w * 0.7, text: "www.yoursite.com", fontSize: w * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#64748b", textAlign: "center", originX: "center", originY: "center" },
            ]
        };
    }
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1e40af", selectable: false, evented: false },
            { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.85, text: title.toUpperCase(), fontSize: h * 0.2, fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
            { type: "Rect", left: w * 0.15, top: h * 0.5, width: w * 0.7, height: 3, fill: "#60a5fa", selectable: false, evented: false },
            { type: "Textbox", left: w / 2, top: h * 0.65, width: w * 0.8, text: "Your subtitle or tagline goes here", fontSize: h * 0.07, fontWeight: "normal", fontFamily: "Inter", fill: "#bfdbfe", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.85, width: w * 0.9, text: "(555) 000-0000  •  www.yoursite.com  •  @yoursocial", fontSize: h * 0.045, fontWeight: "normal", fontFamily: "Inter", fill: "#93c5fd", textAlign: "center", originX: "center", originY: "center" },
        ]
    };
}

function promoPayload(w: number, h: number, title: string) {
    const isSmall = Math.min(w, h) <= 250;
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#7c3aed", selectable: false, evented: false, rx: isSmall ? w / 2 : 12, ry: isSmall ? h / 2 : 12 },
            { type: "Textbox", left: w / 2, top: isSmall ? h / 2 : h * 0.4, width: w * 0.65, text: isSmall ? title.split(' ')[0].toUpperCase() : "YOUR\nBRAND", fontSize: Math.min(w, h) * (isSmall ? 0.18 : 0.16), fontWeight: "bold", fontFamily: "Inter", fill: "#ffffff", textAlign: "center", originX: "center", originY: "center" },
            ...(!isSmall ? [{ type: "Textbox", left: w / 2, top: h * 0.68, width: w * 0.6, text: title, fontSize: Math.min(w, h) * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#e9d5ff", textAlign: "center", originX: "center", originY: "center" }] : []),
        ]
    };
}

function giftPayload(w: number, h: number, title: string, style: 'cutting' | 'award') {
    if (style === 'award') {
        return {
            version: "6.0.0",
            objects: [
                { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#1c1917", selectable: false, evented: false, rx: 8, ry: 8 },
                { type: "Rect", left: w * 0.08, top: h * 0.05, width: w * 0.84, height: h * 0.9, fill: "transparent", stroke: "#b45309", strokeWidth: 2, selectable: false, evented: false, rx: 4, ry: 4 },
                { type: "Textbox", left: w / 2, top: h * 0.15, width: w * 0.6, text: "★", fontSize: w * 0.12, fontWeight: "normal", fontFamily: "Inter", fill: "#d97706", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.7, text: "CERTIFICATE OF", fontSize: w * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#d97706", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { type: "Textbox", left: w / 2, top: h * 0.42, width: w * 0.7, text: "EXCELLENCE", fontSize: w * 0.1, fontWeight: "bold", fontFamily: "Inter", fill: "#fbbf24", textAlign: "center", originX: "center", originY: "center" },
                { type: "Rect", left: w * 0.2, top: h * 0.52, width: w * 0.6, height: 1, fill: "#92400e", selectable: false, evented: false },
                { type: "Textbox", left: w / 2, top: h * 0.62, width: w * 0.65, text: "Presented to", fontSize: w * 0.04, fontWeight: "normal", fontFamily: "Inter", fill: "#a8a29e", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.72, width: w * 0.7, text: "Recipient Name", fontSize: w * 0.08, fontWeight: "bold", fontFamily: "Inter", fill: "#fef3c7", textAlign: "center", originX: "center", originY: "center" },
                { type: "Textbox", left: w / 2, top: h * 0.86, width: w * 0.6, text: "Date • Organization", fontSize: w * 0.035, fontWeight: "normal", fontFamily: "Inter", fill: "#78716c", textAlign: "center", originX: "center", originY: "center" },
            ]
        };
    }
    // cutting board
    return {
        version: "6.0.0",
        objects: [
            { type: "Rect", left: 0, top: 0, width: w, height: h, fill: "#d4a574", selectable: false, evented: false, rx: 16, ry: 16 },
            { type: "Rect", left: w * 0.04, top: h * 0.04, width: w * 0.92, height: h * 0.92, fill: "#c4956a", selectable: false, evented: false, rx: 12, ry: 12 },
            { type: "Textbox", left: w / 2, top: h * 0.3, width: w * 0.7, text: "the", fontSize: h * 0.06, fontWeight: "normal", fontFamily: "Georgia", fill: "#3e2723", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.45, width: w * 0.75, text: "FAMILY NAME", fontSize: h * 0.14, fontWeight: "bold", fontFamily: "Inter", fill: "#3e2723", textAlign: "center", originX: "center", originY: "center" },
            { type: "Textbox", left: w / 2, top: h * 0.58, width: w * 0.7, text: "KITCHEN", fontSize: h * 0.06, fontWeight: "normal", fontFamily: "Inter", fill: "#3e2723", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { type: "Rect", left: w * 0.2, top: h * 0.68, width: w * 0.6, height: 2, fill: "#3e2723", selectable: false, evented: false, opacity: 0.3 },
            { type: "Textbox", left: w / 2, top: h * 0.78, width: w * 0.5, text: "Est. 2024", fontSize: h * 0.05, fontWeight: "normal", fontFamily: "Inter", fill: "#5d4037", textAlign: "center", originX: "center", originY: "center" },
        ]
    };
}

function isSquare(w: number, h: number) {
    return Math.abs(w - h) < 50;
}

// ── Sticker colors palette ──
const stickerColors = [
    { bg: "#ef4444", text: "#ffffff" },
    { bg: "#f97316", text: "#ffffff" },
    { bg: "#eab308", text: "#1a1a1a" },
    { bg: "#22c55e", text: "#ffffff" },
    { bg: "#3b82f6", text: "#ffffff" },
    { bg: "#8b5cf6", text: "#ffffff" },
    { bg: "#ec4899", text: "#ffffff" },
    { bg: "#06b6d4", text: "#ffffff" },
    { bg: "#14b8a6", text: "#ffffff" },
    { bg: "#f43f5e", text: "#ffffff" },
    { bg: "#1e293b", text: "#ffffff" },
    { bg: "#ffffff", text: "#1e293b" },
    { bg: "#fbbf24", text: "#1a1a1a" },
];

// ── The Catalog ─────────────────────────────────────────────

export const HC_BRANDS_CATALOG: TemplateCategory[] = [
    {
        title: "Rubber Stamps",
        items: [
            { id: generateId('stamp'), name: "Self-inking stamps", width: 400, height: 200, category: "Rubber Stamps", payload: stampPayload(400, 200, "Your Company", "123 Main St • City, ST 00000") },
            { id: generateId('stamp'), name: "Pre-inked stamps", width: 400, height: 200, category: "Rubber Stamps", payload: stampPayload(400, 200, "APPROVED", "Date: ___/___/___") },
            { id: generateId('stamp'), name: "Wood handle stamps", width: 400, height: 400, category: "Rubber Stamps", payload: stampPayload(400, 400, "YOUR\nLOGO") },
            { id: generateId('stamp'), name: "Address stamps", width: 600, height: 250, category: "Rubber Stamps", payload: stampPayload(600, 250, "John & Jane Smith", "123 Main Street • City, State 00000") },
            { id: generateId('stamp'), name: "Return address stamps", width: 500, height: 200, category: "Rubber Stamps", payload: stampPayload(500, 200, "The Smith Family", "123 Main St, City, ST 00000") },
            { id: generateId('stamp'), name: "Signature stamps", width: 600, height: 200, category: "Rubber Stamps", payload: stampPayload(600, 200, "John Smith", "Authorized Signature") },
            { id: generateId('stamp'), name: "Logo stamps", width: 500, height: 500, category: "Rubber Stamps", payload: stampPayload(500, 500, "YOUR\nLOGO\nHERE") },
            { id: generateId('stamp'), name: "Teacher stamps", width: 400, height: 400, category: "Rubber Stamps", payload: stampPayload(400, 400, "★ GREAT\nWORK! ★") },
            { id: generateId('stamp'), name: "Inspection stamps", width: 200, height: 200, category: "Rubber Stamps", payload: stampPayload(200, 200, "QC\nPASS") },
            { id: generateId('stamp'), name: "Date stamps", width: 300, height: 150, category: "Rubber Stamps", payload: stampPayload(300, 150, "RECEIVED", "___/___/___") },
            { id: generateId('stamp'), name: "Number stamps", width: 300, height: 150, category: "Rubber Stamps", payload: stampPayload(300, 150, "No. 0000") },
            { id: generateId('stamp'), name: "Notary stamps", width: 500, height: 250, category: "Rubber Stamps", payload: stampPayload(500, 250, "NOTARY PUBLIC", "State of _________ • Comm. #000000") },
            { id: generateId('stamp'), name: "Corporate seal stamps", width: 400, height: 400, category: "Rubber Stamps", payload: stampPayload(400, 400, "CORPORATE\nSEAL") },
            { id: generateId('stamp'), name: "Specialty stamps", width: 400, height: 400, category: "Rubber Stamps", payload: stampPayload(400, 400, "CUSTOM\nDESIGN") },
        ]
    },
    {
        title: "Notary & Professional Supplies",
        items: [
            { id: generateId('notary'), name: "Notary stamps", width: 500, height: 250, category: "Notary", payload: stampPayload(500, 250, "NOTARY PUBLIC", "State of _________ • Comm. Exp: __/__/__") },
            { id: generateId('notary'), name: "Notary embossers", width: 400, height: 400, category: "Notary", payload: notarySealPayload(400, 400, "Notary Embosser") },
            { id: generateId('notary'), name: "Notary seals", width: 400, height: 400, category: "Notary", payload: notarySealPayload(400, 400, "Notary Seal") },
            { id: generateId('notary'), name: "Professional seals", width: 400, height: 400, category: "Notary", payload: notarySealPayload(400, 400, "Professional Seal") },
        ]
    },
    {
        title: "Name Tags & ID",
        items: [
            { id: generateId('id'), name: "Magnetic name tags", width: 600, height: 200, category: "ID", payload: badgePayload(600, 200, "Magnetic Name Tag", false) },
            { id: generateId('id'), name: "Pin name badges", width: 600, height: 200, category: "ID", payload: badgePayload(600, 200, "Pin Name Badge", false) },
            { id: generateId('id'), name: "Reusable name tags", width: 600, height: 200, category: "ID", payload: badgePayload(600, 200, "Reusable Name Tag", false) },
            { id: generateId('id'), name: "Engraved name badges", width: 600, height: 200, category: "ID", payload: badgePayload(600, 200, "Engraved Badge", false) },
            { id: generateId('id'), name: "Full-color printed badges", width: 600, height: 200, category: "ID", payload: badgePayload(600, 200, "Printed Badge", false) },
            { id: generateId('id'), name: "Employee badges", width: 400, height: 600, category: "ID", payload: badgePayload(400, 600, "Employee Badge", true) },
            { id: generateId('id'), name: "Photo ID badges", width: 400, height: 600, category: "ID", payload: badgePayload(400, 600, "Photo ID", true) },
            { id: generateId('id'), name: "Visitor badges", width: 400, height: 600, category: "ID", payload: badgePayload(400, 600, "Visitor Badge", true) },
            { id: generateId('id'), name: "Custom badge holders", width: 450, height: 650, category: "ID", payload: badgePayload(450, 650, "Custom Badge", true) },
        ]
    },
    {
        title: "Custom Signs",
        items: [
            { id: generateId('sign'), name: "Office door signs", width: 800, height: 200, category: "Signs", payload: signPayload(800, 200, "Office Door Sign", 'office') },
            { id: generateId('sign'), name: "Desk name plates", width: 800, height: 200, category: "Signs", payload: signPayload(800, 200, "Desk Name Plate", 'office') },
            { id: generateId('sign'), name: "Cubicle name plates", width: 800, height: 200, category: "Signs", payload: signPayload(800, 200, "Cubicle Name Plate", 'office') },
            { id: generateId('sign'), name: "Room signs", width: 600, height: 600, category: "Signs", payload: signPayload(600, 600, "Room Sign", 'ada') },
            { id: generateId('sign'), name: "Wayfinding signs", width: 600, height: 800, category: "Signs", payload: signPayload(600, 800, "Wayfinding", 'ada') },
            { id: generateId('sign'), name: "Directional signs", width: 800, height: 400, category: "Signs", payload: signPayload(800, 400, "Directional Sign", 'directional') },
            { id: generateId('sign'), name: "ADA braille signs", width: 600, height: 600, category: "Signs", payload: signPayload(600, 600, "ADA Braille Sign", 'ada') },
            { id: generateId('sign'), name: "Restroom ADA signs", width: 600, height: 800, category: "Signs", payload: signPayload(600, 800, "Restroom", 'ada') },
            { id: generateId('sign'), name: "Exit ADA signs", width: 800, height: 400, category: "Signs", payload: signPayload(800, 400, "EXIT", 'ada') },
            { id: generateId('sign'), name: "Accessibility signs", width: 600, height: 600, category: "Signs", payload: signPayload(600, 600, "Accessible", 'ada') },
            { id: generateId('sign'), name: "OSHA safety signs", width: 800, height: 1200, category: "Signs", payload: signPayload(800, 1200, "OSHA Safety Sign", 'safety') },
            { id: generateId('sign'), name: "Warning signs", width: 800, height: 800, category: "Signs", payload: signPayload(800, 800, "Warning Sign", 'safety') },
            { id: generateId('sign'), name: "Hazard signs", width: 800, height: 800, category: "Signs", payload: signPayload(800, 800, "Hazard Sign", 'safety') },
            { id: generateId('sign'), name: "Aluminum signs", width: 1200, height: 800, category: "Signs", payload: signPayload(1200, 800, "Aluminum Sign", 'property') },
            { id: generateId('sign'), name: "PVC signs", width: 1200, height: 800, category: "Signs", payload: signPayload(1200, 800, "PVC Sign", 'property') },
            { id: generateId('sign'), name: "Metal signs", width: 1200, height: 800, category: "Signs", payload: signPayload(1200, 800, "Metal Sign", 'property') },
            { id: generateId('sign'), name: "Property signs", width: 1200, height: 800, category: "Signs", payload: signPayload(1200, 800, "Property Sign", 'property') },
            { id: generateId('sign'), name: "Real estate signs", width: 1200, height: 800, category: "Signs", payload: signPayload(1200, 800, "Real Estate Sign", 'property') },
        ]
    },
    {
        title: "Yard Signs",
        items: [
            { id: generateId('yard'), name: "Real estate yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Real Estate", 'realestate') },
            { id: generateId('yard'), name: "Contractor yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Contractor", 'contractor') },
            { id: generateId('yard'), name: "Political yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Political", 'political') },
            { id: generateId('yard'), name: "Event yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Event", 'event') },
            { id: generateId('yard'), name: "Custom yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Custom", 'generic') },
            { id: generateId('yard'), name: "Coroplast yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "Coroplast", 'generic') },
            { id: generateId('yard'), name: "H-stake yard signs", width: 1200, height: 900, category: "Yard Signs", payload: yardSignPayload(1200, 900, "H-stake", 'generic') },
        ]
    },
    {
        title: "Wall Graphics & Décor",
        items: [
            { id: generateId('wall'), name: "Wall decals", width: 1000, height: 1000, category: "Wall Graphics", payload: wallGraphicPayload(1000, 1000, "Wall Decal") },
            { id: generateId('wall'), name: "Wall stickers", width: 800, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(800, 800, "Wall Sticker") },
            { id: generateId('wall'), name: "Vinyl wall graphics", width: 1200, height: 1200, category: "Wall Graphics", payload: wallGraphicPayload(1200, 1200, "Vinyl Wall Graphic") },
            { id: generateId('wall'), name: "Wall murals", width: 2400, height: 1200, category: "Wall Graphics", payload: wallGraphicPayload(2400, 1200, "Wall Mural") },
            { id: generateId('wall'), name: "Window murals", width: 2400, height: 1200, category: "Wall Graphics", payload: wallGraphicPayload(2400, 1200, "Window Mural") },
            { id: generateId('wall'), name: "Kids wall decals", width: 800, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(800, 800, "Kids Wall Decal") },
            { id: generateId('wall'), name: "Business wall decals", width: 1200, height: 1200, category: "Wall Graphics", payload: wallGraphicPayload(1200, 1200, "Business Wall Decal") },
            { id: generateId('wall'), name: "Educational wall decals", width: 1200, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(1200, 800, "Educational Wall Decal") },
            { id: generateId('wall'), name: "Sports wall decals", width: 800, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(800, 800, "Sports Wall Decal") },
            { id: generateId('wall'), name: "Animal wall decals", width: 800, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(800, 800, "Animal Wall Decal") },
            { id: generateId('wall'), name: "Space themed decals", width: 800, height: 800, category: "Wall Graphics", payload: wallGraphicPayload(800, 800, "Space Themed Decal") },
            { id: generateId('wall'), name: "Die-cut wall decals", width: 1000, height: 1000, category: "Wall Graphics", payload: wallGraphicPayload(1000, 1000, "Die-Cut Wall Decal") },
            { id: generateId('wall'), name: "Wallpaper decal sets", width: 1200, height: 2400, category: "Wall Graphics", payload: wallGraphicPayload(1200, 2400, "Wallpaper Decal Set") },
        ]
    },
    {
        title: "Stickers & Decals",
        items: [
            { id: generateId('sticker'), name: "Die-cut stickers", width: 400, height: 400, category: "Stickers", payload: stickerPayload(400, 400, "Die-Cut Sticker", stickerColors[0].bg, stickerColors[0].text) },
            { id: generateId('sticker'), name: "Kiss-cut stickers", width: 400, height: 400, category: "Stickers", payload: stickerPayload(400, 400, "Kiss-Cut Sticker", stickerColors[1].bg, stickerColors[1].text) },
            { id: generateId('sticker'), name: "Transfer vinyl decals", width: 600, height: 300, category: "Stickers", payload: stickerPayload(600, 300, "Vinyl Decal", stickerColors[4].bg, stickerColors[4].text) },
            { id: generateId('sticker'), name: "Window decals", width: 800, height: 800, category: "Stickers", payload: stickerPayload(800, 800, "Window Decal", stickerColors[11].bg, stickerColors[11].text) },
            { id: generateId('sticker'), name: "Window clings", width: 800, height: 800, category: "Stickers", payload: stickerPayload(800, 800, "Window Cling", stickerColors[7].bg, stickerColors[7].text) },
            { id: generateId('sticker'), name: "Static cling stickers", width: 600, height: 600, category: "Stickers", payload: stickerPayload(600, 600, "Static Cling", stickerColors[3].bg, stickerColors[3].text) },
            { id: generateId('sticker'), name: "Reflective stickers", width: 400, height: 400, category: "Stickers", payload: stickerPayload(400, 400, "Reflective Sticker", stickerColors[10].bg, stickerColors[10].text) },
            { id: generateId('sticker'), name: "Holographic stickers", width: 400, height: 400, category: "Stickers", payload: stickerPayload(400, 400, "Holographic Sticker", stickerColors[5].bg, stickerColors[5].text) },
            { id: generateId('sticker'), name: "Glitter stickers", width: 400, height: 400, category: "Stickers", payload: stickerPayload(400, 400, "Glitter Sticker", stickerColors[6].bg, stickerColors[6].text) },
            { id: generateId('sticker'), name: "Water bottle stickers", width: 300, height: 300, category: "Stickers", payload: stickerPayload(300, 300, "Water Bottle", stickerColors[8].bg, stickerColors[8].text) },
            { id: generateId('sticker'), name: "Laptop stickers", width: 400, height: 300, category: "Stickers", payload: stickerPayload(400, 300, "Laptop Sticker", stickerColors[9].bg, stickerColors[9].text) },
            { id: generateId('sticker'), name: "Car stickers", width: 600, height: 400, category: "Stickers", payload: stickerPayload(600, 400, "Car Sticker", stickerColors[12].bg, stickerColors[12].text) },
            { id: generateId('sticker'), name: "Custom sticker sheets", width: 800, height: 1200, category: "Stickers", payload: stickerPayload(800, 1200, "Custom Sticker Sheet", stickerColors[2].bg, stickerColors[2].text) },
        ]
    },
    {
        title: "Magnets",
        items: [
            { id: generateId('magnet'), name: "Car magnets", width: 1200, height: 600, category: "Magnets", payload: magnetPayload(1200, 600, "Car Magnet", 'car') },
            { id: generateId('magnet'), name: "Refrigerator magnets", width: 400, height: 400, category: "Magnets", payload: magnetPayload(400, 400, "Refrigerator Magnet", 'fridge') },
            { id: generateId('magnet'), name: "Business magnets", width: 600, height: 400, category: "Magnets", payload: magnetPayload(600, 400, "Business Magnet", 'business') },
            { id: generateId('magnet'), name: "Promotional magnets", width: 400, height: 400, category: "Magnets", payload: magnetPayload(400, 400, "Promotional Magnet", 'promo') },
            { id: generateId('magnet'), name: "Save-the-date magnets", width: 600, height: 800, category: "Magnets", payload: magnetPayload(600, 800, "Save-the-Date", 'savedate') },
        ]
    },
    {
        title: "Banners & Prints",
        items: [
            { id: generateId('banner'), name: "Vinyl banners", width: 2400, height: 800, category: "Banners", payload: bannerPayload(2400, 800, "Vinyl Banner", false) },
            { id: generateId('banner'), name: "Mesh banners", width: 2400, height: 800, category: "Banners", payload: bannerPayload(2400, 800, "Mesh Banner", false) },
            { id: generateId('banner'), name: "Event banners", width: 3600, height: 1200, category: "Banners", payload: bannerPayload(3600, 1200, "Event Banner", false) },
            { id: generateId('banner'), name: "Retractable banners", width: 1000, height: 2400, category: "Banners", payload: bannerPayload(1000, 2400, "Retractable Banner", true) },
        ]
    },
    {
        title: "Promotional Products",
        items: [
            { id: generateId('promo'), name: "Buttons / pinback buttons", width: 200, height: 200, category: "Promo", payload: promoPayload(200, 200, "Pinback Button") },
            { id: generateId('promo'), name: "Koozies / drink sleeves", width: 400, height: 400, category: "Promo", payload: promoPayload(400, 400, "Koozie Design") },
            { id: generateId('promo'), name: "Promotional giveaways", width: 400, height: 400, category: "Promo", payload: promoPayload(400, 400, "Promo Giveaway") },
            { id: generateId('promo'), name: "Business swag items", width: 600, height: 600, category: "Promo", payload: promoPayload(600, 600, "Business Swag") },
        ]
    },
    {
        title: "Personalized Gifts",
        items: [
            { id: generateId('gift'), name: "Engraved cutting boards", width: 1200, height: 800, category: "Gifts", payload: giftPayload(1200, 800, "Cutting Board", 'cutting') },
            { id: generateId('gift'), name: "Awards", width: 600, height: 800, category: "Gifts", payload: giftPayload(600, 800, "Award", 'award') },
        ]
    }
];

// Assign preview images to any items missing them
(() => {
    const backgrounds = [
        "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    ];

    HC_BRANDS_CATALOG.forEach(category => {
        category.items.forEach((item, index) => {
            if (!item.image) {
                item.image = backgrounds[index % backgrounds.length];
            }
        });
    });
})();
