import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating default admin user...');

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@farm.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Farm Admin',
      email: 'admin@farm.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+91 8886438606',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: admin@farm.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
