import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config.server'; // Use the .server version

export async function GET() {
    try {
        const config = getConfig();
        return NextResponse.json({
            predefinedCategories: config.predefined_categories.sort() // Sort them as before
        });
    } catch (error) {
        console.error('Failed to load app configuration:', error);
        return NextResponse.json(
            { message: 'Failed to load application configuration' },
            { status: 500 }
        );
    }
}