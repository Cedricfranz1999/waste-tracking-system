import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';

// GET all scanners
export async function GET() {
  try {
    const scanners = await db.scanner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(scanners);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scanners' },
      { status: 500 }
    );
  }
}

// POST create new scanner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scanner = await db.scanner.create({
      data: body,
    });
    return NextResponse.json(scanner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create scanner' },
      { status: 500 }
    );
  }
}


