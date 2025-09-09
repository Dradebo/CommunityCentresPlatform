import bcrypt from 'bcryptjs';
import prisma from '../config/database';

async function seed() {
  try {
    console.log('Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kampalacenters.org' },
      update: {},
      create: {
        email: 'admin@kampalacenters.org',
        password: adminPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        verified: true
      }
    });

    console.log('Created admin user:', admin.email);

    // Create some visitor users
    const visitorPassword = await bcrypt.hash('visitor123', 12);
    const visitor = await prisma.user.upsert({
      where: { email: 'visitor@example.com' },
      update: {},
      create: {
        email: 'visitor@example.com',
        password: visitorPassword,
        name: 'Test Visitor',
        role: 'VISITOR',
        verified: true
      }
    });

    console.log('Created visitor user:', visitor.email);

    // Create community centers
    const centers = [
      {
        name: 'Kampala Community Hub',
        location: 'Central Division, Kampala',
        latitude: 0.3476,
        longitude: 32.5825,
        services: ['Skills Training', 'Healthcare', 'Education', 'Microfinance'],
        description: 'A comprehensive community center serving Central Kampala with various social services.',
        verified: true,
        managerId: admin.id,
        addedBy: admin.id,
        phone: '+256-700-123456',
        email: 'info@kampalahub.org',
        website: 'www.kampalahub.org'
      },
      {
        name: 'Makerere Community Center',
        location: 'Kawempe Division, Kampala',
        latitude: 0.3354,
        longitude: 32.5659,
        services: ['Youth Programs', 'Computer Training', 'Library'],
        description: 'Located near Makerere University, focusing on youth development and education.',
        verified: true,
        managerId: admin.id,
        addedBy: admin.id,
        phone: '+256-700-234567',
        email: 'contact@makererecenter.org'
      },
      {
        name: 'Mengo Women\'s Center',
        location: 'Rubaga Division, Kampala',
        latitude: 0.3029,
        longitude: 32.5599,
        services: ['Women Empowerment', 'Childcare', 'Vocational Training'],
        description: 'Dedicated to empowering women and supporting families in the Mengo area.',
        verified: false,
        addedBy: visitor.id,
        phone: '+256-700-345678'
      },
      {
        name: 'Nakawa Skills Center',
        location: 'Nakawa Division, Kampala',
        latitude: 0.3373,
        longitude: 32.6268,
        services: ['Vocational Training', 'Computer Training', 'Skills Training'],
        description: 'Focused on providing technical and vocational skills to youth in Nakawa.',
        verified: true,
        managerId: admin.id,
        addedBy: admin.id,
        phone: '+256-700-456789',
        email: 'info@nakawaskills.org'
      },
      {
        name: 'Makindye Health & Wellness',
        location: 'Makindye Division, Kampala',
        latitude: 0.2735,
        longitude: 32.6055,
        services: ['Healthcare', 'Mental Health', 'Women Empowerment'],
        description: 'Community health center providing medical services and wellness programs.',
        verified: false,
        addedBy: visitor.id,
        phone: '+256-700-567890'
      },
      {
        name: 'Rubaga Youth Sports Club',
        location: 'Rubaga Division, Kampala',
        latitude: 0.3025,
        longitude: 32.5590,
        services: ['Sports & Recreation', 'Youth Programs', 'Community Events'],
        description: 'Sports and recreation center engaging youth through various athletic programs.',
        verified: true,
        managerId: admin.id,
        addedBy: admin.id,
        phone: '+256-700-678901',
        email: 'info@rubagasports.org'
      },
      {
        name: 'Central Library & Learning Hub',
        location: 'Central Division, Kampala',
        latitude: 0.3480,
        longitude: 32.5830,
        services: ['Library', 'Education', 'Computer Training', 'Adult Literacy'],
        description: 'Public library offering educational resources, computer access, and learning programs.',
        verified: true,
        managerId: admin.id,
        addedBy: admin.id,
        phone: '+256-700-789012',
        email: 'library@centrallearning.org',
        website: 'www.centrallearninghub.org'
      },
      {
        name: 'Kawempe Legal Aid Center',
        location: 'Kawempe Division, Kampala',
        latitude: 0.3360,
        longitude: 32.5665,
        services: ['Legal Aid', 'Community Events', 'Education'],
        description: 'Provides free legal assistance and education to community members.',
        verified: false,
        addedBy: visitor.id,
        phone: '+256-700-890123'
      }
    ];

    const createdCenters = [];
    for (const centerData of centers) {
      // Check if center already exists
      const existingCenter = await prisma.communityCenter.findFirst({
        where: { name: centerData.name }
      });
      
      let center: any;
      if (existingCenter) {
        center = existingCenter;
        console.log('Center already exists:', center.name);
      } else {
        center = await prisma.communityCenter.create({
          data: centerData
        });
        console.log('Created center:', center.name);
      }
      
      createdCenters.push(center);
    }

    // Create some connections between centers
    const connections = [
      [createdCenters[0].id, createdCenters[1].id], // Kampala Hub <-> Makerere
      [createdCenters[0].id, createdCenters[2].id], // Kampala Hub <-> Mengo Women's
      [createdCenters[1].id, createdCenters[6].id], // Makerere <-> Central Library
      [createdCenters[5].id, createdCenters[2].id], // Rubaga Sports <-> Mengo Women's
    ];

    for (const [centerAId, centerBId] of connections) {
      await prisma.connection.upsert({
        where: {
          centerAId_centerBId: { centerAId, centerBId }
        },
        update: {},
        create: {
          centerAId,
          centerBId
        }
      });
      console.log(`Connected centers: ${centerAId} <-> ${centerBId}`);
    }

    // Create a sample contact message
    await prisma.contactMessage.create({
      data: {
        centerId: createdCenters[0].id,
        senderUserId: visitor.id,
        senderName: visitor.name,
        senderEmail: visitor.email,
        subject: 'Inquiry about Skills Training Programs',
        message: 'Hello, I would like to know more about the skills training programs you offer. What are the requirements and schedules?',
        inquiryType: 'Program Information',
        status: 'PENDING'
      }
    });

    console.log('Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@kampalacenters.org / admin123');
    console.log('Visitor: visitor@example.com / visitor123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();