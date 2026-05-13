-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "createdById" TEXT;

-- Backfill: assign creator = oldest admin per trip
UPDATE "Trip" t
SET "createdById" = (
  SELECT tm."userId"
  FROM "TripMember" tm
  WHERE tm."tripId" = t."id" AND tm."role" = 'ADMIN'
  ORDER BY tm."joinedAt" ASC
  LIMIT 1
)
WHERE "createdById" IS NULL;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
