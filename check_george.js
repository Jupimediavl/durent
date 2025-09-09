const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGeorge() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'George',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        createdAt: true
      }
    });
    
    console.log('George user details:', user);
    
    if (user) {
      // Check his rentals
      const rentals = await prisma.rentalRelationship.findMany({
        where: {
          tenantId: user.id
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
      const payments = await prisma.payment.findMany({
        where: {
          rental: {
            tenantId: user.id
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      console.log('George payments:', payments);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGeorge();