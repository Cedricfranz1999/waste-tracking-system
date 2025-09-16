import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { sendVerifyEmail } from '~/lib/mailer';
import { db } from '~/server/db';
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const verificaton = await db.verificationCode.findFirst({
      where: { email: payload?.email, code: payload?.code }
    })

    if (!verificaton) {
      return NextResponse.json({ ok: false, message: "Verification code does not matched" }, { status: 400 })
    }

    const { code, ...rest } = payload
    const user = await db.scanner.create({
      data: {
        ...rest,
        verifyAt: new Date().toISOString(),
        password: bcrypt.hashSync(payload?.password, 10)
      }
    })

    await db.verificationCode.delete({
      where: { id: verificaton.id }
    })

    const { password, ...userRest } = user
    const secret = process.env.JWT_SECRET || 'secret'
    const token = jwt.sign(userRest, secret, {
      expiresIn: '7d'
    })

    return NextResponse.json({
      ok: true,
      token: token,
      userRest,
    })
  } catch (error) {
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

    await db.verificationCode.create({
      data: {
        email: email,
        code
      }
    })

    await sendVerifyEmail(email, code)

    return NextResponse.json({ ok: true, message: "Verification code was sent successfully." })
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, { status: 500 })
  }
}