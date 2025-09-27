import { NextResponse } from 'next/server';
import barangays from 'barangay.json'

export async function GET(req: Request) {
  try {
    const list = (barangays as any[]).filter((x: any) => x?.city_code == "086003")
    return NextResponse.json(list)
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, { status: 500 })
  }
}