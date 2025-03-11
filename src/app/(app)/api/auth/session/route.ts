import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { app } from '@/lib/firebase/admin-config'

// Initialize Firebase Admin Auth
const adminAuth = getAuth(app)

// Set session duration to 2 weeks
const SESSION_EXPIRATION = 60 * 60 * 24 * 14 * 1000

export async function POST(request: NextRequest) {
  try {
    // Get the ID token from the request body
    const { idToken } = await request.json()
    
    // Validate ID token
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      )
    }
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRATION,
    })
    
    // Set the cookie
    await (await cookies()).set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_EXPIRATION / 1000, // Convert to seconds
      path: '/',
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Clear the session cookie
  await (await cookies()).delete('session')
  return NextResponse.json({ success: true })
} 