const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  { name: "Midnight Velvet", category: "Women", description: "A dark, alluring blend of black rose, vanilla, and smoked agarwood.", price: 4500, price30ml: 1800, price3ml: 350, stock: 50 },
  { name: "Oud Noir", category: "Unisex", description: "Intense and earthy. Rich cedar, amber, and rare oriental oud.", price: 5200, price30ml: 2100, price3ml: 400, stock: 35 },
  { name: "Santal 33 Replica", category: "Men", description: "Crisp sandalwood, leather, and spicy cardamom.", price: 3800, price30ml: 1500, price3ml: 300, stock: 120 },
  { name: "Jasmine Blanc", category: "Women", description: "Pure white floral elegance with a touch of sweet honeysuckle.", price: 4100, price30ml: 1600, price3ml: 320, stock: 80 },
  { name: "Aqua di Mare", category: "Men", description: "Fresh ocean breeze, bergamot, and salty marine notes.", price: 3500, price30ml: 1400, price3ml: 280, stock: 200 },
  { name: "Rouge Rouge", category: "Women", description: "A fiery mix of red berries, jasmine, and saffron.", price: 5500, price30ml: 2200, price3ml: 450, stock: 25 },
  { name: "Vetiver Silk", category: "Unisex", description: "Smooth, creamy vetiver wrapped in soft cashmere woods.", price: 4800, price30ml: 1900, price3ml: 380, stock: 60 },
  { name: "Citrus Sunrise", category: "Unisex", description: "Bright grapefruit, blood orange, and a hint of mint.", price: 3200, price30ml: 1200, price3ml: 250, stock: 150 },
  { name: "Tobacco Vanille", category: "Men", description: "Warm, sweet tobacco leaf layered with rich Madagascar vanilla.", price: 4900, price30ml: 2000, price3ml: 390, stock: 40 },
  { name: "Peony Dream", category: "Women", description: "A delicate, romantic burst of pink peony and spring rose.", price: 3900, price30ml: 1550, price3ml: 310, stock: 90 }
];

async function main() {
  console.log("Injecting products into database...");
  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log("Successfully seeded 10 products!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });