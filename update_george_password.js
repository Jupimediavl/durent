const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateGeorgePassword() {
  try {
    // First check current password hash
    const user = await prisma.user.findFirst({
      where: {
        email: 'George@durent.com'
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    console.log('Current George data:', user);
    
    if (user) {
      // Hash the new password
      const newPasswordHash = await bcrypt.hash('123456', 10);
      console.log('New password hash:', newPasswordHash);
      
      // Update the password
      const updated = await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          password: newPasswordHash
        }
      });
      
      console.log('Password updated successfully for user:', updated.email);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeorgePassword();