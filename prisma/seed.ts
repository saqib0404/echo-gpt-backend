import 'dotenv/config';

import {
  PlanCode,
  PrismaClient,
  RoleName,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.role.upsert({
    where: {
      name: RoleName.USER,
    },

    update: {
      description:
        'Standard EchoGPT application user',
    },

    create: {
      name: RoleName.USER,
      description:
        'Standard EchoGPT application user',
    },
  });

  await prisma.role.upsert({
    where: {
      name: RoleName.ADMIN,
    },

    update: {
      description:
        'EchoGPT administrator with management privileges',
    },

    create: {
      name: RoleName.ADMIN,
      description:
        'EchoGPT administrator with management privileges',
    },
  });

  await prisma.plan.upsert({
    where: {
      code: PlanCode.FREE,
    },

    update: {
      name: 'Free',
      description:
        'Default free EchoGPT subscription plan',
      monthlyRequestLimit: 100,
      isActive: true,
    },

    create: {
      code: PlanCode.FREE,
      name: 'Free',
      description:
        'Default free EchoGPT subscription plan',
      monthlyRequestLimit: 100,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: {
      code: PlanCode.PREMIUM,
    },

    update: {
      name: 'Premium',
      description:
        'Premium EchoGPT subscription plan',
      monthlyRequestLimit: 10000,
      isActive: true,
    },

    create: {
      code: PlanCode.PREMIUM,
      name: 'Premium',
      description:
        'Premium EchoGPT subscription plan',
      monthlyRequestLimit: 10000,
      isActive: true,
    },
  });

  console.log(
    'Database seed completed successfully.',
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      'Database seed failed:',
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });