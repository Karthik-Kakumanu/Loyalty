// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create a User (if not exists)
  const user = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      name: 'Test User',
      phone: '9999999999',
    },
  })

  // 2. Create Cafes
  const cafes = [
    {
      name: 'Blue Tokai Coffee',
      address: 'Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      image: 'bg-zinc-800', // Using CSS color class as placeholder
      rating: 4.8,
      visitCount: 120,
      lat: 17.4,
      lng: 78.4
    },
    {
      name: 'Third Wave Coffee',
      address: 'Gachibowli, Hyderabad',
      city: 'Hyderabad',
      image: 'bg-amber-900',
      rating: 4.6,
      visitCount: 95,
      lat: 17.42,
      lng: 78.38
    },
    {
      name: 'Roastery Coffee House',
      address: 'Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      image: 'bg-orange-800',
      rating: 4.9,
      visitCount: 200,
      lat: 17.41,
      lng: 78.43
    },
    {
      name: 'Starbucks',
      address: 'Hitech City, Hyderabad',
      city: 'Hyderabad',
      image: 'bg-green-900',
      rating: 4.5,
      visitCount: 300,
      lat: 17.44,
      lng: 78.39
    },
    {
      name: 'Araku Coffee',
      address: 'Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      image: 'bg-red-900',
      rating: 4.7,
      visitCount: 150,
      lat: 17.43,
      lng: 78.41
    }
  ]

  for (const cafe of cafes) {
    const createdCafe = await prisma.cafe.create({ data: cafe })
    
    // 3. Create a Loyalty Card for the first 3 cafes for our user
    if (['Blue Tokai Coffee', 'Third Wave Coffee', 'Starbucks'].includes(cafe.name)) {
      await prisma.loyaltyCard.create({
        data: {
          userId: user.id,
          cafeId: createdCafe.id,
          stamps: Math.floor(Math.random() * 8) + 1, // Random stamps 1-8
          maxStamps: 10,
          tier: 'Silver',
          balance: 100
        }
      })
    }
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })