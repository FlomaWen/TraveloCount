import { PrismaClient, TripRole, TripAmbiance, ExpenseCategory, SplitMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lea = await prisma.user.upsert({
    where: { email: 'lea@example.com' },
    update: {},
    create: { email: 'lea@example.com', name: 'Léa Marchand' },
  });
  const marc = await prisma.user.upsert({
    where: { email: 'marc@example.com' },
    update: {},
    create: { email: 'marc@example.com', name: 'Marc' },
  });

  const trip = await prisma.trip.create({
    data: {
      title: 'Lisbonne en mai',
      destination: 'Lisbonne, Portugal',
      startDate: new Date('2026-05-12'),
      endDate: new Date('2026-05-19'),
      ambiance: TripAmbiance.CITY_BREAK,
      currency: 'EUR',
      budget: '1920.00',
      members: {
        create: [
          { userId: lea.id, role: TripRole.ADMIN },
          { userId: marc.id, role: TripRole.MEMBER },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      tripId: trip.id,
      payerId: marc.id,
      label: 'Vol AR Paris↔Lisbonne',
      category: ExpenseCategory.TRANSPORT,
      amount: '1240.00',
      currency: 'EUR',
      date: new Date('2026-05-11'),
      splitMethod: SplitMethod.EQUAL,
      shares: {
        create: [
          { userId: lea.id, amount: '620.00' },
          { userId: marc.id, amount: '620.00' },
        ],
      },
    },
  });

  console.log(`Seeded trip ${trip.id} with 2 members and 1 expense`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
