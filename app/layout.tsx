import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Design Wizard',
    description: 'A commerce-native design tool that beats Canva on Frictionless Personalization.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
