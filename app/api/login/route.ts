import { NextRequest, NextResponse } from 'next/server'
import { loginTeacher, loginCentralOffice } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result
    if (role === 'teacher') {
      result = await loginTeacher(username, password)
    } else if (role === 'central_office') {
      result = await loginCentralOffice(username, password)
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Return user data (we'll store in localStorage on client side)
    return NextResponse.json({
      success: true,
      user: result.user
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}