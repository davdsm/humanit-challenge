/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.SEED_PASSWORD || 'changeme';

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  console.log(`Seeded user ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
