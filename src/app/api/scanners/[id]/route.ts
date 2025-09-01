// src/app/api/scanners/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Scanner ID is required' },
        { status: 400 }
      );
    }

    await db.scanner.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      message: 'Scanner deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scanner' },
      { status: 500 }
    );
  }
}