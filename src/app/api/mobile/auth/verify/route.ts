import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { sendVerifyEmail } from '~/lib/mailer';
import { db } from '~/server/db';
import jwt from 'jsonwebtoken'
import { encodeToBase64WithMarkers } from '~/utils/string';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const verificaton = await db.verificationCode.findFirst({
      where: { email: payload?.email, code: payload?.code }
    })

    if (!verificaton) {
      return NextResponse.json({ ok: false, message: "Verification code does not matched" }, { status: 400 })
    }

    const { code, password, ...payloadRest } = payload
    const scanner = await db.scanner.create({
      data: {
        verifyAt: new Date().toISOString(),
        email: JSON.stringify(encodeToBase64WithMarkers(payload.email)),
        username: JSON.stringify(encodeToBase64WithMarkers(payload.email)),
        password: JSON.stringify(encodeToBase64WithMarkers(payload.password)),
        firstname: JSON.stringify(encodeToBase64WithMarkers(payload.firstname)),
        lastname: JSON.stringify(encodeToBase64WithMarkers(payload.lastname)),
        address: JSON.stringify(encodeToBase64WithMarkers(`P${payload?.purok}. Barangay ${payload?.barangay}, Calbayog City`)),
        barangay: JSON.stringify(encodeToBase64WithMarkers(payload?.barangay)),
        purok: JSON.stringify(encodeToBase64WithMarkers(payload?.purok)),
        gender: JSON.stringify(encodeToBase64WithMarkers(payload.gender)),
        birthdate: payload?.birthdate,
      }
    })

    await db.verificationCode.delete({
      where: { id: verificaton.id }
    })

    const secret = process.env.JWT_SECRET || 'secret'
    const token = jwt.sign({ ...payloadRest, id: scanner.id }, secret, {
      expiresIn: '7d'
    })

    return NextResponse.json({
      ok: true,
      token: token,
      user: { ...payloadRest, id: scanner.id },
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email") as string
    
    // await new Promise((res) => setTimeout(res, 3000))

    const exist = await db.scanner.findFirst({
      where: { username: email }
    })

    if (exist) {
      return NextResponse.json({ ok: false, message: "Email already registered." }, { status: 400 })
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString()

    const existRequest = await db.verificationCode.findFirst({
      where: { email }
    })

    if (existRequest) {
      await db.verificationCode.update({
        where: { id: existRequest.id },
        data: {
          code,
        }
      })
    }else {
      await db.verificationCode.create({
        data: {
          email: email,
          code
        }
      })
    }

    await sendVerifyEmail(email, code)

    return NextResponse.json({ ok: true, message: "Verification code was sent successfully." })
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, { status: 500 })
  }
}