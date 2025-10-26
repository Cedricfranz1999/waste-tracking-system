import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { safeDecode } from '~/utils/string';
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'secret'

const decodeImage = (imageData: any): string | null => {
  if (!imageData) return null;
  
  try {
    if (typeof imageData === 'object' && imageData.value && imageData.$ && imageData.$$) {
      return Buffer.from(imageData.value, 'base64').toString('utf8');
    }
    
    if (typeof imageData === 'string') {
      const parsed = JSON.parse(imageData);
      if (parsed && parsed.value && parsed.$ && parsed.$$) {
        return Buffer.from(parsed.value, 'base64').toString('utf8');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding image:', error);
    return null;
  }
}

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
                image: decodeImage(event.product?.image), 
                barcode: code
              }
            })
          } else {
            const allManufacturers = await db.manufacturer.findMany()
            
            const matchingManufacturer = allManufacturers.find(manufacturer => {
              const decodedManufacturerBarcode = safeDecode(manufacturer.barcode);
              return decodedManufacturerBarcode && code.startsWith(decodedManufacturerBarcode);
            })
            
            if (matchingManufacturer) {
              const event = await db.scanEvent.create({
                data: {
                  scannerId: decoded?.id,
                  manufacturerId: matchingManufacturer.id,
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
                  name: safeDecode(event.manufacturer?.name || null),
                  barcode: safeDecode(matchingManufacturer.barcode) // Use the actual manufacturer barcode
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
            take: Number(take) || 10,
            skip: Number(skip) || 0,
            orderBy: { scannedAt: 'desc' }
          })

          const total = await db.scanEvent.count({
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
                image: decodeImage(d.product?.image), 
                barcode: safeDecode(d?.product?.barcode||null)
              } : null,
              manufacturer: d?.manufacturer ? {
                ...d.manufacturer,
                name: safeDecode(d.manufacturer?.name || null),
                barcode: safeDecode(d?.manufacturer?.barcode||null)
              } : null
            })),
            total: total
          })
        }
      }
    }

    return NextResponse.json({ message: "Hello world" })
  } catch (error) {
    return NextResponse.json(error, { status: 500 })
  }
}