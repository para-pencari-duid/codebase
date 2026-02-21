-- Delete the OLD settings record (keep the newest one)
-- Run this in Prisma Studio or your database client

-- Check first (you should see 2 records)
SELECT id, "businessName", "whatsappTenantId", "whatsappConnected" FROM "Settings";

-- Delete the OLD record (ID: "default" with tenant bakery-ixEwLmxrx847)
DELETE FROM "Settings" WHERE id = 'default';

-- Verify (should see only 1 record now)
SELECT id, "businessName", "whatsappTenantId", "whatsappConnected" FROM "Settings";
