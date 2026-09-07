/* Production admin seed — plain CJS so it runs in the slim runner image. */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "parent@example.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "家長", role: "ADMIN" },
  });
  console.log(`✓ admin user: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
