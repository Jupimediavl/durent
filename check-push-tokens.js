const { PrismaClient } = require('@prisma/client');

// Use Railway database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

async function checkPushTokens() {
  try {
    console.log('🔍 Checking push tokens for all users...\n');

    // Get all users with their push token status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        pushToken: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total users: ${users.length}\n`);

    // Separate users by push token status
    const usersWithTokens = users.filter(u => u.pushToken);
    const usersWithoutTokens = users.filter(u => !u.pushToken);

    console.log('✅ Users WITH push tokens:');
    console.log('─'.repeat(50));
    if (usersWithTokens.length === 0) {
      console.log('   ❌ No users have push tokens');
    } else {
      usersWithTokens.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.name} (${user.email})`);
        console.log(`      Type: ${user.userType}`);
        console.log(`      Token: ${user.pushToken ? user.pushToken.substring(0, 30) + '...' : 'NULL'}`);
        console.log('');
      });
    }

    console.log('\n❌ Users WITHOUT push tokens:');
    console.log('─'.repeat(50));
    if (usersWithoutTokens.length === 0) {
      console.log('   ✅ All users have push tokens!');
    } else {
      usersWithoutTokens.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.name} (${user.email})`);
        console.log(`      Type: ${user.userType}`);
        console.log(`      Joined: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('\n📈 Statistics:');
    console.log('─'.repeat(50));
    console.log(`   Users with tokens: ${usersWithTokens.length} (${Math.round(usersWithTokens.length/users.length*100)}%)`);
    console.log(`   Users without tokens: ${usersWithoutTokens.length} (${Math.round(usersWithoutTokens.length/users.length*100)}%)`);

    // Check active rental relationships
    console.log('\n🏠 Active rental relationships:');
    console.log('─'.repeat(50));
    const rentals = await prisma.rentalRelationship.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: {
          select: {
            name: true,
            pushToken: true
          }
        },
        landlord: {
          select: {
            name: true,
            pushToken: true
          }
        },
        property: {
          select: {
            title: true
          }
        }
      }
    });

    if (rentals.length === 0) {
      console.log('   ❌ No active rental relationships');
    } else {
      rentals.forEach((rental, i) => {
        console.log(`   ${i+1}. ${rental.property.title}`);
        console.log(`      Landlord: ${rental.landlord.name} - Token: ${rental.landlord.pushToken ? '✅' : '❌'}`);
        console.log(`      Tenant: ${rental.tenant.name} - Token: ${rental.tenant.pushToken ? '✅' : '❌'}`);
        console.log('');
      });
    }

    console.log('\n✅ Check completed!');

  } catch (error) {
    console.error('❌ Error checking push tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPushTokens();