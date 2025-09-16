import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    return NextResponse.json({ message: "Hello world" })
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}