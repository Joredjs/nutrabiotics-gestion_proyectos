import { PrismaClient, UserRole, ProjectStatus, Priority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.refreshToken.deleteMany();
  await prisma.projectDeveloper.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0066cc&color=fff',
    },
  });

  // Manager users
  const manager1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'manager@test.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=00cc66&color=fff',
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Michael Chen',
      email: 'michael.chen@test.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=cc6600&color=fff',
    },
  });

  // Developer users
  const developers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alex Rodriguez',
        email: 'dev@test.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        avatar: 'https://ui-avatars.com/api/?name=Alex+Rodriguez&background=cc0066&color=fff',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Emma Thompson',
        email: 'emma.thompson@test.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        avatar: 'https://ui-avatars.com/api/?name=Emma+Thompson&background=6600cc&color=fff',
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Kim',
        email: 'david.kim@test.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=0099cc&color=fff',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lisa Wang',
        email: 'lisa.wang@test.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        avatar: 'https://ui-avatars.com/api/?name=Lisa+Wang&background=cc9900&color=fff',
      },
    }),
    prisma.user.create({
      data: {
        name: 'James Brown',
        email: 'james.brown@test.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        avatar: 'https://ui-avatars.com/api/?name=James+Brown&background=009933&color=fff',
      },
    }),
  ]);

  console.log('👥 Created users');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform Redesign',
      description: 'Complete redesign of the e-commerce platform with modern UI/UX and improved performance.',
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      managerId: manager1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android with real-time features.',
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-08-15'),
      managerId: manager2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Integration Project',
      description: 'Integration with third-party APIs and microservices architecture implementation.',
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-04-30'),
      managerId: manager1.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'Data Analytics Dashboard',
      description: 'Business intelligence dashboard with real-time analytics and reporting.',
      status: ProjectStatus.COMPLETED,
      priority: Priority.MEDIUM,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-31'),
      managerId: manager2.id,
    },
  });

  console.log('📋 Created projects');

  // Assign developers to projects
  await prisma.projectDeveloper.createMany({
    data: [
      // E-commerce Platform Redesign
      { projectId: project1.id, developerId: developers[0].id },
      { projectId: project1.id, developerId: developers[1].id },
      { projectId: project1.id, developerId: developers[2].id },

      // Mobile App Development
      { projectId: project2.id, developerId: developers[1].id },
      { projectId: project2.id, developerId: developers[3].id },

      // API Integration Project
      { projectId: project3.id, developerId: developers[0].id },
      { projectId: project3.id, developerId: developers[4].id },

      // Data Analytics Dashboard
      { projectId: project4.id, developerId: developers[2].id },
      { projectId: project4.id, developerId: developers[3].id },
    ],
  });

  console.log('🔗 Assigned developers to projects');

  // Create tasks
  const tasks = [
    // E-commerce Platform tasks
    {
      title: 'Design System Implementation',
      description: 'Implement the new design system components and tokens.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      projectId: project1.id,
      assignedToId: developers[1].id,
      estimatedHours: 40,
      actualHours: 25,
      dueDate: new Date('2025-02-15'),
    },
    {
      title: 'Shopping Cart Optimization',
      description: 'Optimize shopping cart performance and add new features.',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      projectId: project1.id,
      assignedToId: developers[0].id,
      estimatedHours: 30,
      dueDate: new Date('2025-03-01'),
    },
    {
      title: 'Payment Gateway Integration',
      description: 'Integrate new payment methods and improve checkout flow.',
      status: TaskStatus.REVIEW,
      priority: Priority.HIGH,
      projectId: project1.id,
      assignedToId: developers[2].id,
      estimatedHours: 50,
      actualHours: 48,
      dueDate: new Date('2025-02-28'),
    },

    // Mobile App tasks
    {
      title: 'User Authentication Module',
      description: 'Implement secure user authentication with biometric support.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      projectId: project2.id,
      assignedToId: developers[1].id,
      estimatedHours: 35,
      dueDate: new Date('2025-03-15'),
    },
    {
      title: 'Push Notifications Setup',
      description: 'Configure push notifications for both iOS and Android.',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      projectId: project2.id,
      assignedToId: developers[3].id,
      estimatedHours: 20,
      dueDate: new Date('2025-04-01'),
    },

    // API Integration tasks
    {
      title: 'Microservices Architecture',
      description: 'Design and implement microservices architecture.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      projectId: project3.id,
      assignedToId: developers[0].id,
      estimatedHours: 60,
      actualHours: 30,
      dueDate: new Date('2025-03-30'),
    },
    {
      title: 'Third-party API Integration',
      description: 'Integrate payment, shipping, and inventory APIs.',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      projectId: project3.id,
      assignedToId: developers[4].id,
      estimatedHours: 40,
      actualHours: 42,
      dueDate: new Date('2025-02-01'),
    },

    // Analytics Dashboard tasks (completed project)
    {
      title: 'Dashboard UI Development',
      description: 'Create responsive dashboard interface with charts.',
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      projectId: project4.id,
      assignedToId: developers[2].id,
      estimatedHours: 45,
      actualHours: 50,
      dueDate: new Date('2024-11-30'),
    },
    {
      title: 'Data Visualization Components',
      description: 'Implement interactive charts and graphs.',
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      projectId: project4.id,
      assignedToId: developers[3].id,
      estimatedHours: 35,
      actualHours: 38,
      dueDate: new Date('2024-12-15'),
    },
  ];

  await prisma.task.createMany({ data: tasks });

  console.log('✅ Created tasks');

  // Update some users' last login
  await prisma.user.updateMany({
    where: {
      id: { in: [admin.id, manager1.id, developers[0].id] },
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  console.log('🔄 Updated last login for some users');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('Admin: admin@test.com / password123');
  console.log('Manager: manager@test.com / password123');
  console.log('Developer: dev@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
