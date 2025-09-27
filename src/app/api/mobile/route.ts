import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log(bcrypt.hashSync('passowrd', 10))
    return NextResponse.json({ message: "Hello world" })
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}