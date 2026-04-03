const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    name: "W61 - Nectarine Blossom & Honey (Inspired)",
    category: "Women",
    description: "A sweet, fruity floral fragrance inspired by a London morning market.",
    // NEW: Detailed Shopee-style description using newline characters (\n)
    details: "• FDA Approved – registered and compliant with Philippine FDA safety standards\n• Long-lasting fragrance – stays on skin and clothes for up to 12+ hours\n• 15% fragrance oil concentration – delivers a bold, intense scent\n• High-quality oils sourced from top international fragrance suppliers\n• Oil-based formula – adheres better to skin, ideal for tropical climate\n• Travel-friendly – compact enough for bags or travel cases\n• Skin-safe formulation – gentle and suitable for most skin types\n• Great for daily use, professional wear, or evening occasions",
    price: 350, // Example prices
    price30ml: 135,
    stock100ml: 50,
    stock30ml: 50,
    topNotes: "Green Notes, Black Currant, Petitgrain",
    heartNotes: "Nectarine, Black Locust",
    baseNotes: "Peach, Plum, Vetiver",
    scentFamily: "Fruity Floral",
    // NEW: Array of images (You can put actual URLs here later)
    images: [
      "/images/product-w61-1.jpg",
      "/images/product-w61-2.jpg",
      "/images/product-w61-3.jpg",
      "/images/product-w61-4.jpg"
    ]
  },
  // ... (Add other products here)
];

async function main() {
  console.log("Injecting products into database...");
  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log("Successfully seeded products!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });