import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { safeDecode } from '~/utils/string';
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'secret'

export async function POST(req: Request) {
  try {
    const { code, lat, lng, qty } = await req.json();
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      if (token && lat && lng && qty) {
        const decoded: any = jwt.verify(token, secret)
        if(decoded?.id) {
          const product = await db.product.findFirst({
            where: {
              barcode: {
                contains: Buffer.from(code, "utf-8").toString("base64")
              }
            }
          })
          if (product) {
            const event = await db.scanEvent.create({
              data: {
                scannerId: decoded?.id,
                productId: product.id,
                latitude: lat.toString(),
                longitude: lng.toString(),
                quantity: Number(qty)
              },
              include: {
                product: true
              }
            })

            return NextResponse.json({
              ...event,
              product: {
                ...event.product,
                manufacturer: safeDecode(event.product?.manufacturer || null),
                name: safeDecode(event.product?.name || null),
                description: safeDecode(event.product?.description || null),
                barcode: code
              }
            })
          }else {
            const manufacturer = await db.manufacturer.findFirst({
              where: {
                barcode: {
                  contains: Buffer.from(code, "utf-8").toString("base64")
                }
              }
            })
            if (manufacturer) {
              const event = await db.scanEvent.create({
                data: {
                  scannerId: decoded?.id,
                  manufacturerId: manufacturer.id,
                  latitude: lat.toString(),
                  longitude: lng.toString(),
                  quantity: Number(qty)
                },
                include: {
                  manufacturer: true
                }
              })

              return NextResponse.json({
                ...event,
                manufacturer: {
                  ...event.manufacturer,
                  // manufacturer: safeDecode(event.manufacturer?.name || null),
                  name: safeDecode(event.manufacturer?.name || null),
                  // description: safeDecode(event.product?.description || null),
                  barcode: code
                }
              })
            }
          }
          console.log(product, 'waray')
        }
      }
    }
    return NextResponse.json({ message: "Failed to save scan event." }, { status: 400 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      if (token) {
        const decoded: any = jwt.verify(token, secret)
        if(decoded?.id) {
          const data = await db.scanEvent.findMany({
            where: { 
              scannerId: decoded?.id
            },
            include: { product: true, manufacturer: true },
            take: Number(take),
            skip: Number(skip)
          })

          const total = await db.scanEvent.findMany({
            where: { 
              scannerId: decoded?.id
            }
          })

          return NextResponse.json({
            rows: data.map((d) => ({
              ...d,
              product: d?.product ? {
                ...d.product,
                manufacturer: safeDecode(d.product?.manufacturer || null),
                name: safeDecode(d.product?.name || null),
                description: safeDecode(d.product?.description || null),
                barcode: safeDecode(d?.product?.barcode||null)
              } : null,
              manufacturer: d?.manufacturer ? {
                ...d.manufacturer,
                name: safeDecode(d.manufacturer?.name || null),
                barcode: safeDecode(d?.manufacturer?.barcode||null)
              } : null
            })),
            total
          })
        }
      }
    }

    return NextResponse.json({ message: "Hello world" })
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}