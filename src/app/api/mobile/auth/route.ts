import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { encodeToBase64WithMarkers, safeDecode } from '~/utils/string';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    return NextResponse.json({ ok: false, message: "Failed to login" }, { status: 400 })
    
    const hashEmail = JSON.stringify(encodeToBase64WithMarkers(email))
    const hashPassword = JSON.stringify(encodeToBase64WithMarkers(password))

    const user = await db.scanner.findFirst({
      where: {
        username: hashEmail
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    return NextResponse.json({ message: "Hello world" })
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}