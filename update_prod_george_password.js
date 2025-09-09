const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Using bcryptjs like in the auth controller

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

async function updateGeorgePassword() {
  try {
    console.log('Updating George password in production...');
    
    // Hash password with bcryptjs (same as auth controller)
    const newPasswordHash = await bcrypt.hash('123456', 10);
    console.log('New bcryptjs hash:', newPasswordHash);
    
    // Update George's password
    const updated = await prisma.user.update({
      where: {
        email: 'George@durent.com'
      },
      data: {
        password: newPasswordHash
      }
    });
    
    console.log('Password updated successfully for:', updated.email);
    console.log('User ID:', updated.id);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeorgePassword();