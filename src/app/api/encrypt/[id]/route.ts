import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

// Base64 decoding utility for backend
const decodeFromBase64 = (encoded: string): string => {
  return decodeURIComponent(
    escape(Buffer.from(encoded, "base64").toString("utf8")),
  );
};

const decodeObjectFromBase64 = (obj: any): any => {
  const decoded: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value && key !== "image") {
      try {
        decoded[key] = decodeFromBase64(value);
      } catch {
        decoded[key] = value;
      }
    } else {
      decoded[key] = value;
    }
  }
  return decoded;
};

// Base64 encoding utility for backend
const encodeToBase64 = (data: string): string => {
  return Buffer.from(unescape(encodeURIComponent(data)), "utf8").toString(
    "base64",
  );
};

const encodeObjectToBase64 = (obj: any): any => {
  const encoded: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value && key !== "image") {
      encoded[key] = encodeToBase64(value);
    } else {
      encoded[key] = value;
    }
  }
  return encoded;
};

export async function GET(request: NextRequest) {
  try {
    const scanners = await db.scanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    const decodedScanners = scanners.map((scanner) =>
      decodeObjectFromBase64(scanner),
    );

    return NextResponse.json(decodedScanners);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scanners" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const encodedData = encodeObjectToBase64(body);

    const scanner = await db.scanner.create({
      data: encodedData,
    });

    return NextResponse.json(scanner, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to create scanner" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // Changed from randomPath to id
) {
  try {
    const { id } = await params; // Now using id directly from params

    if (!id) {
      return NextResponse.json(
        { error: "Scanner ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Encode the incoming data to Base64 before updating
    const encodedData = encodeObjectToBase64(body);

    const scanner = await db.scanner.update({
      where: { id },
      data: encodedData,
    });

    return NextResponse.json(scanner);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update scanner" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // Changed from randomPath to id
) {
  try {
    const { id } = await params; // Now using id directly from params

    if (!id) {
      return NextResponse.json(
        { error: "Scanner ID is required" },
        { status: 400 },
      );
    }

    const scanner = await db.scanner.findUnique({
      where: { id },
    });

    if (!scanner) {
      return NextResponse.json({ error: "Scanner not found" }, { status: 404 });
    }

    await db.scanner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Scanner deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete scanner" },
      { status: 500 },
    );
  }
}
