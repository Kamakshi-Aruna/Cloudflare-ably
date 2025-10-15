import { NextRequest, NextResponse } from 'next/server';
import * as Ably from 'ably';
import { d1 } from '@/lib/d1-client';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.ABLY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Ably API key not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { name, email, message } = body;

        // Save to D1 database
        try {
            console.log('💾 Saving to D1 database...');
            await d1.insert('form_submissions', {
                name,
                email,
                message,
            });
            console.log('✅ Successfully saved to D1 database');
        } catch (dbError) {
            console.error('❌ Error saving to D1:', dbError);
            // Continue even if DB save fails
        }

        // Initialize Ably REST client
        const client = new Ably.Rest(apiKey);
        const channel = client.channels.get('notifications');

        // Publish event to Ably channel
        const messageData = {
            message: `New form submission from ${name} (${email}): ${message}`,
            name,
            email,
            userMessage: message,
            timestamp: Date.now(),
        };

        console.log('📤 Publishing to Ably:', messageData);

        await channel.publish('form-submission', messageData);

        console.log('✅ Successfully published to Ably');

        return NextResponse.json({
            success: true,
            message: 'Form submitted successfully',
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        return NextResponse.json(
            { error: 'Failed to submit form' },
            { status: 500 }
        );
    }
}