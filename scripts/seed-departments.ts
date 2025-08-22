import { db } from "../server/db";
import { departments } from "../shared/schema";

async function seedDepartments() {
  try {
    console.log('🌱 Seeding departments...');
    
    // Check if departments already exist
    const existing = await db.select().from(departments);
    console.log(`Found ${existing.length} existing departments`);
    
    if (existing.length === 0) {
      // Create sample departments
      const sampleDepartments = [
        { name: 'Human Resource', code: 'HR', description: 'Human Resources Department' },
        { name: 'Information Technology', code: 'IT', description: 'Information Technology Department' },
        { name: 'Finance', code: 'FIN', description: 'Finance and Accounting Department' },
        { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
        { name: 'Operations', code: 'OPS', description: 'Operations Department' }
      ];
      
      for (const dept of sampleDepartments) {
        const [created] = await db.insert(departments).values(dept).returning();
        console.log(`✅ Created department: ${created.name} (${created.code})`);
      }
      
      console.log('🎉 Department seeding completed!');
    } else {
      console.log('⚠️ Departments already exist, skipping seed');
      existing.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.code})`);
      });
    }
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    process.exit(0);
  }
}

seedDepartments();