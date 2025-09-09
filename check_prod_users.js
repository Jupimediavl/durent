const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

async function checkProdUsers() {
  try {
    console.log('Checking production database...');
    
    // Check all users with name containing "George"
    const georgeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: 'George',
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: 'george',
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true
      }
    });
    
    console.log('George users in production:', georgeUsers);
    
    // If we find George, check his rentals and payments
    if (georgeUsers.length > 0) {
      const george = georgeUsers.find(u => u.userType === 'TENANT') || georgeUsers[0];
      console.log('Selected George:', george);
      
      // Check his rentals
      const rentals = await prisma.rentalRelationship.findMany({
        where: {
          tenantId: george.id
        },
        include: {
          property: {
            select: {
              title: true,
              monthlyRent: true
            }
          }
        }
      });
      
      console.log('George rentals:', rentals);
      
      // Check his payments
      if (rentals.length > 0) {
        const payments = await prisma.payment.findMany({
          where: {
            rental: {
              tenantId: george.id
            }
          },
          where: {
            status: 'PENDING',
            dueDate: {
              gte: new Date()
            }
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: 3
        });
        
        console.log('George upcoming payments:', payments);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProdUsers();