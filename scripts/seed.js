const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@colorwin.com" },
    update: {},
    create: {
      email: "admin@colorwin.com",
      phone: "9999999999",
      passwordHash: adminPassword,
      role: "ADMIN",
      wallet: {
        create: { balance: 100000.0 },
      },
    },
  });
  console.log("Admin account created:", admin.email);

  // 2. Demo User
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@colorwin.com" },
    update: {},
    create: {
      email: "demo@colorwin.com",
      phone: "9876543210",
      passwordHash: userPassword,
      role: "USER",
      wallet: {
        create: { balance: 1000.0 },
      },
    },
  });
  console.log("Demo user account created:", user.email);

  // 3. Initial Game Round
  const existingRound = await prisma.gameRound.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!existingRound) {
    const startsAt = new Date();
    const closesAt = new Date(startsAt.getTime() + 180 * 1000);
    const round = await prisma.gameRound.create({
      data: {
        roundNumber: 100001,
        startsAt,
        closesAt,
        status: "ACTIVE",
      },
    });
    console.log("Initial game round created: #", round.roundNumber);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
