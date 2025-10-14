import { NextRequest, NextResponse } from 'next/server';
import * as Ably from 'ably';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ABLY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Ably API key not configured' },
        { status: 500 }
      );
    }

    const client = new Ably.Rest(apiKey);
    const tokenRequestData = await client.auth.createTokenRequest({
      clientId: 'notifications-client',
    });

    return NextResponse.json(tokenRequestData);
  } catch (error) {
    console.error('Error creating Ably token:', error);
    return NextResponse.json(
      { error: 'Failed to create Ably token' },
      { status: 500 }
    );
  }
}