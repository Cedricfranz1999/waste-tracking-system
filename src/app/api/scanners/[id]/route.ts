// src/app/api/encrypt/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // Change randomPath to id
) {
  try {
    const { id } = await params; // Now this will work correctly

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Your encryption logic here...

    return NextResponse.json({
      message: "Encryption successful",
      id: id,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Failed to process encryption" },
      { status: 500 },
    );
  }
}
