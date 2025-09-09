const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConnection() {
  try {
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true
      }
    });
    
    console.log('All users in database:', users);
    
    // Specifically search for George
    const george = await prisma.user.findUnique({
      where: {
        email: 'George@durent.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true
      }
    });
    
    console.log('George found:', george);
    
    // Also search case-insensitive
    const georgeInsensitive = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'george@durent.com',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true
      }
    });
    
    console.log('George (case-insensitive):', georgeInsensitive);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();