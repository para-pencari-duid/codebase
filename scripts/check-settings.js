// Simple Node script to check Settings table
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.settings.findMany();
    
    console.log(`\n📊 Total Settings Records: ${settings.length}\n`);
    
    if (settings.length === 0) {
      console.log('❌ No settings found in database!');
      return;
    }
    
    settings.forEach((s, i) => {
      console.log(`Record ${i + 1}:`);
      console.log(`  ID: ${s.id}`);
      console.log(`  Business Name: ${s.businessName}`);
      console.log(`  Tax Rate: ${s.taxRate}%`);
      console.log(`  WA Tenant ID: ${s.whatsappTenantId || 'NULL'}`);
      console.log(`  WA Connected: ${s.whatsappConnected}`);
      console.log(`  WA Enabled: ${s.whatsappEnabled}`);
      console.log(`  Owner Phone: ${s.ownerPhone || 'NULL'}`);
      console.log('');
    });
    
    if (settings.length > 1) {
      console.log('⚠️  WARNING: Multiple settings records detected!');
      console.log('💡 Run: node scripts/fix-duplicate-settings.js to merge them\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
