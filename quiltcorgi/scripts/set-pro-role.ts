import { db } from '../src/lib/db';
import { users } from '../src/db/schema';
import { desc, eq } from 'drizzle-orm';

async function setProRole() {
  const [user] = await db.select().from(users).orderBy(desc(users.createdAt)).limit(1);
  
  if (!user) {
    console.log('No users found in database');
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);
  console.log(`Current role: ${user.role}`);

  await db.update(users).set({ role: 'pro' }).where(eq(users.id, user.id));

  console.log('✅ Updated role to: pro');
  process.exit(0);
}

setProRole();
