import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { encodeToBase64WithMarkers, safeDecode } from "~/utils/string";
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'secret'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const hashEmail = JSON.stringify(encodeToBase64WithMarkers(email));
    
    const user = await db.scanner.findFirst({
      where: {
        username: {
          contains: hashEmail
        },
      },
    });

    if (user) {
      const decodedPassword = safeDecode(user.password || "", 1);
      if (decodedPassword === password) {
        const formattedUser = {
          ...user,
          email: safeDecode(user.email || "", 1),
          username: safeDecode(user.username || "", 1),
          password: safeDecode(user.password || "", 1),
          firstname: safeDecode(user.firstname || "", 1),
          lastname: safeDecode(user.lastname || "", 1),
          address: safeDecode(user.address || "", 1),
          birthdate: safeDecode(user.birthdate || "", 1),
          gender: safeDecode(user.gender || "", 1)
        }
        const { password, ...restUser } = formattedUser
        
        const token = jwt.sign(restUser, secret, {
          expiresIn: '7d'
        })
        return NextResponse.json({
          ok: true,
          token,
          user: restUser,
        });
      }
    }
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      if (token) {
        const decoded: any = jwt.verify(token, secret)

        const hashEmail = JSON.stringify(encodeToBase64WithMarkers(decoded?.email));
        const rawUser = await db.scanner.findFirst({ where: { email: hashEmail } })

        return NextResponse.json({
          ...rawUser,
          email: safeDecode(rawUser?.email || "", 1),
          username: safeDecode(rawUser?.username || "", 1),
          firstname: safeDecode(rawUser?.firstname || "", 1),
          lastname: safeDecode(rawUser?.lastname || "", 1),
          address: safeDecode(rawUser?.address || "", 1),
          gender: safeDecode(rawUser?.gender || "", 1),
          barangay: safeDecode(rawUser?.barangay || "", 1),
          purok: safeDecode(rawUser?.purok || "", 1)
        })
      }
    }
    return NextResponse.json({ message: "Unauthorize" }, { status: 401 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
