-- AlterTable: Trip default split method
ALTER TABLE "Trip" ADD COLUMN "defaultSplitMethod" "SplitMethod" NOT NULL DEFAULT 'EQUAL';

-- AlterTable: User activity filter
ALTER TABLE "User" ADD COLUMN "activityFilter" "ActivityType"[] DEFAULT ARRAY['TRIP_CREATED', 'MEMBER_JOINED', 'EXPENSE_ADDED', 'EXPENSE_SETTLED', 'ITINERARY_ADDED', 'DOCUMENT_UPLOADED', 'MESSAGE_POSTED']::"ActivityType"[];
