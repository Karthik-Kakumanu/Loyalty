import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Onboarding Cake Roven...");

  const cafe = await prisma.cafe.create({
    data: {
      name: "Cake Roven",
      description: "Artisan bakery and premium coffee house serving the finest pastries in town.",
      address: "Brindavan Main Road, Guntur, Andhra Pradesh",
      city: "Guntur",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop", // High quality image
      cardPrefix: "CR", // <--- THIS IS CRITICAL FOR YOUR REQUIREMENT
      nextCardSeq: 1,   // Starts counting from 0001
      rating: 4.9,
      totalTables: 15,
      lat: 17.4, 
      lng: 78.4
    }
  });

  console.log(`✅ Cake Roven created with ID: ${cafe.id}`);
  console.log(`ℹ️ GENERATED QR CODE DATA: REVISTRA://cafe/${cafe.id}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());