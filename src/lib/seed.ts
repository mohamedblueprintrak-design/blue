import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import logger from '@/lib/logger';

/**
 * BluePrint Seed Script
 * Creates demo data for the engineering consultancy management system
 * SECURITY: Uses randomly generated passwords for seed users
 */

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
  let password = '';
  const bytes = randomBytes(20);
  for (let i = 0; i < 20; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  logger.info('🌱 Seeding BluePrint database...\n');

  // ========== 1. Admin User ==========
  const adminPassword = generateSecurePassword();
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await db.user.upsert({
    where: { email: 'admin@blueprint.ae' },
    update: { password: adminHash },
    create: {
      email: 'admin@blueprint.ae',
      password: adminHash,
      name: 'المدير العام',
      phone: '+971-50-123-4567',
      role: 'admin',
      department: 'الإدارة',
      position: 'مدير عام',
      isActive: true,
    },
  });
  logger.info('✅ Admin user created:', adminUser.email);

  // ========== 2. Additional Users (matching ROLES in login page) ==========
  const additionalUsers = [
    { email: 'pm@blueprint.ae', name: 'عمر يوسف', phone: '+971-50-678-9012', role: 'project_manager', department: 'إدارة المشاريع', position: 'مدير مشاريع' },
    { email: 'eng@blueprint.ae', name: 'أحمد محمد', phone: '+971-50-234-5678', role: 'engineer', department: 'القسم المعماري', position: 'مهندس' },
    { email: 'arch@blueprint.ae', name: 'يوسف خالد', phone: '+971-50-111-2233', role: 'engineer', department: 'القسم المعماري', position: 'مهندس معماري' },
    { email: 'struct@blueprint.ae', name: 'سارة علي', phone: '+971-50-222-3344', role: 'engineer', department: 'القسم الإنشائي', position: 'مهندس إنشائي' },
    { email: 'elec@blueprint.ae', name: 'محمد سعيد', phone: '+971-50-333-4455', role: 'engineer', department: 'القسم الكهربائي', position: 'مهندس كهربائي' },
    { email: 'site@blueprint.ae', name: 'خالد عبدالله', phone: '+971-50-444-5566', role: 'engineer', department: 'إدارة الموقع', position: 'مهندس موقع' },
    { email: 'mep@blueprint.ae', name: 'ناصر سعيد', phone: '+971-50-555-6677', role: 'engineer', department: 'القسم الكهروميكانيكي', position: 'مهندس ميكانيكا' },
    { email: 'draft@blueprint.ae', name: 'فهد الحربي', phone: '+971-50-666-7788', role: 'engineer', department: 'الرسم والتصميم', position: 'رسام' },
    { email: 'acc@blueprint.ae', name: 'فاطمة حسن', phone: '+971-50-567-8901', role: 'accountant', department: 'المالية', position: 'محاسب' },
    { email: 'sec@blueprint.ae', name: 'نورة العتيبي', phone: '+971-50-777-8899', role: 'secretary', department: 'الإدارة', position: 'سكرتيرة' },
    { email: 'hr@blueprint.ae', name: 'مريم الشامسي', phone: '+971-50-888-9900', role: 'hr', department: 'الموارد البشرية', position: 'موارد بشرية' },
    { email: 'viewer@blueprint.ae', name: 'عبدالرحمن الزيودي', phone: '+971-50-999-0011', role: 'viewer', department: 'الإدارة', position: 'مشاهد' },
  ];

  const userHash = await bcrypt.hash(generateSecurePassword(), 10);
  const createdUsers: Record<string, { id: string; name: string }> = {};

  for (const u of additionalUsers) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { password: userHash },
      create: {
        email: u.email,
        password: userHash,
        name: u.name,
        phone: u.phone,
        role: u.role,
        department: u.department,
        position: u.position,
        isActive: true,
      },
    });
    createdUsers[u.email] = { id: user.id, name: user.name || u.name };
  }

  // Also create the original seed users (different emails used in internal system)
  const engineerUser = await db.user.upsert({
    where: { email: 'ahmed@blueprint.ae' },
    update: { password: userHash },
    create: {
      email: 'ahmed@blueprint.ae',
      password: userHash,
      name: 'أحمد محمد',
      phone: '+971-50-234-5678',
      role: 'engineer',
      department: 'القسم المعماري',
      position: 'مهندس معماري أول',
      isActive: true,
    },
  });

  const structuralUser = await db.user.upsert({
    where: { email: 'sara@blueprint.ae' },
    update: { password: userHash },
    create: {
      email: 'sara@blueprint.ae',
      password: userHash,
      name: 'سارة علي',
      phone: '+971-50-345-6789',
      role: 'engineer',
      department: 'القسم الإنشائي',
      position: 'مهندسة إنشائية',
      isActive: true,
    },
  });

  const mepUser = await db.user.upsert({
    where: { email: 'khalid@blueprint.ae' },
    update: { password: userHash },
    create: {
      email: 'khalid@blueprint.ae',
      password: userHash,
      name: 'خالد سعيد',
      phone: '+971-50-456-7890',
      role: 'engineer',
      department: 'القسم الكهروميكانيكي',
      position: 'مهندس كهربائي',
      isActive: true,
    },
  });

  const pmUser = createdUsers['pm@blueprint.ae'] || await db.user.findFirst({ where: { email: 'pm@blueprint.ae' } });

  logger.info('✅ Demo users created (18 users total)');

  // ========== 3. Company Settings ==========
  const companySettings = await db.companySettings.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      name: 'بلوبرنت للاستشارات الهندسية',
      nameEn: 'BluePrint Engineering Consultancy',
      logo: '',
      email: 'info.blueprintrak@gmail.com',
      phone: '+971-7-234-5678',
      address: 'رأس الخيمة، الإمارات العربية المتحدة',
      taxNumber: '100000000000000',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      workingDays: 'sun,thu',
      workingHours: '07:30-16:30',
    },
  });
  logger.info('✅ Company settings created:', companySettings.name);

  // ========== 4. Employee Records ==========
  await db.employee.upsert({
    where: { id: 'emp-admin' },
    update: {},
    create: {
      id: 'emp-admin',
      userId: adminUser.id,
      department: 'الإدارة',
      position: 'مدير عام',
      salary: 35000,
      employmentStatus: 'active',
      hireDate: new Date('2020-01-15'),
    },
  });

  await db.employee.upsert({
    where: { id: 'emp-ahmed' },
    update: {},
    create: {
      id: 'emp-ahmed',
      userId: engineerUser.id,
      department: 'القسم المعماري',
      position: 'مهندس معماري أول',
      salary: 22000,
      employmentStatus: 'active',
      hireDate: new Date('2021-03-01'),
    },
  });

  await db.employee.upsert({
    where: { id: 'emp-sara' },
    update: {},
    create: {
      id: 'emp-sara',
      userId: structuralUser.id,
      department: 'القسم الإنشائي',
      position: 'مهندسة إنشائية',
      salary: 20000,
      employmentStatus: 'active',
      hireDate: new Date('2022-06-15'),
    },
  });

  await db.employee.upsert({
    where: { id: 'emp-khalid' },
    update: {},
    create: {
      id: 'emp-khalid',
      userId: mepUser.id,
      department: 'القسم الكهروميكانيكي',
      position: 'مهندس كهربائي',
      salary: 20000,
      employmentStatus: 'active',
      hireDate: new Date('2021-09-01'),
    },
  });

  await db.employee.upsert({
    where: { id: 'emp-omar' },
    update: {},
    create: {
      id: 'emp-omar',
      userId: pmUser.id,
      department: 'إدارة المشاريع',
      position: 'مدير مشاريع',
      salary: 28000,
      employmentStatus: 'active',
      hireDate: new Date('2020-06-01'),
    },
  });
  logger.info('✅ Employee records created (5 employees)');

  // ========== 5. Clients ==========
  const client1 = await db.client.create({
    data: {
      name: 'محمد بن راشد',
      company: 'شركة الإعمار العقارية',
      email: 'mbinrashid@almouj.ae',
      phone: '+971-50-111-2233',
      address: 'دبي، الإمارات العربية المتحدة',
      taxNumber: '200000000000000',
      creditLimit: 500000,
      paymentTerms: '30 days after invoice',
    },
  });

  const client2 = await db.client.create({
    data: {
      name: 'أحمد الشامسي',
      company: 'مجموعة الشامسي القابضة',
      email: 'info@shamsigroup.ae',
      phone: '+971-50-444-5566',
      address: 'أبو ظبي، الإمارات العربية المتحدة',
      taxNumber: '300000000000000',
      creditLimit: 1000000,
      paymentTerms: '45 days after invoice',
    },
  });

  const client3 = await db.client.create({
    data: {
      name: 'سعاد الكتبي',
      company: 'تطوير المشاريع المتقدمة',
      email: 'projects@advanced-dev.ae',
      phone: '+971-50-777-8899',
      address: 'رأس الخيمة، الإمارات العربية المتحدة',
      taxNumber: '400000000000000',
      creditLimit: 300000,
      paymentTerms: 'Net 30',
    },
  });

  const client4 = await db.client.create({
    data: {
      name: 'ناصر العتيبي',
      company: 'شركة النخبة للاستثمار',
      email: 'nasser@nukhba.ae',
      phone: '+971-50-222-3344',
      address: 'الشارقة، الإمارات العربية المتحدة',
      taxNumber: '500000000000000',
      creditLimit: 750000,
      paymentTerms: '60 days after invoice',
    },
  });
  logger.info('✅ Demo clients created (4 clients)');

  // ========== 6. Projects ==========
  const project1 = await db.project.create({
    data: {
      number: 'PRJ-2024-001',
      name: 'فيلا فاخرة - المنطقة الأولى',
      nameEn: 'Luxury Villa - Zone 1',
      clientId: client1.id,
      location: 'دبي، المنطقة الأولى',
      plotNumber: 'DXB-LOT-1203',
      type: 'villa',
      status: 'active',
      progress: 65,
      budget: 250000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-30'),
      description: 'تصميم وبناء فيلا فاخرة مكونة من طابقين مع حمام سباحة وحديقة',
      createdById: adminUser.id,
    },
  });

  const project2 = await db.project.create({
    data: {
      number: 'PRJ-2024-002',
      name: 'مبنى سكني متعدد الطوابق',
      nameEn: 'Multi-Story Residential Building',
      clientId: client2.id,
      location: 'أبو ظبي، شاطئ الراحة',
      plotNumber: 'ADH-LOT-7892',
      type: 'building',
      status: 'active',
      progress: 40,
      budget: 850000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-06-30'),
      description: 'مبنى سكني من 12 طابق مع مواقف سيارات تحت الأرض ومرافق مشتركة',
      createdById: pmUser.id,
    },
  });

  const project3 = await db.project.create({
    data: {
      number: 'PRJ-2024-003',
      name: 'مجمع تجاري - المنطقة الحرة',
      nameEn: 'Commercial Complex - Free Zone',
      clientId: client3.id,
      location: 'رأس الخيمة، المنطقة الحرة',
      plotNumber: 'RKN-LOT-4521',
      type: 'commercial',
      status: 'active',
      progress: 20,
      budget: 1200000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-12-31'),
      description: 'مجمع تجاري متعدد الاستخدامات يشمل محلات ومكاتب ومنطقة ترفيهية',
      createdById: pmUser.id,
    },
  });

  const project4 = await db.project.create({
    data: {
      number: 'PRJ-2024-004',
      name: 'فيلا عائلية - المنطقة السكنية',
      nameEn: 'Family Villa - Residential Area',
      clientId: client4.id,
      location: 'الشارقة، المنطقة السكنية الجديدة',
      plotNumber: 'SHJ-LOT-0567',
      type: 'villa',
      status: 'completed',
      progress: 100,
      budget: 180000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-03-15'),
      description: 'فيلا عائلية من طابق واحد مع حديقة ومرآب',
      createdById: adminUser.id,
    },
  });

  const project5 = await db.project.create({
    data: {
      number: 'PRJ-2024-005',
      name: 'منشأة صناعية - منطقة الصناعات',
      nameEn: 'Industrial Facility - Industrial Zone',
      clientId: client2.id,
      location: 'رأس الخيمة، منطقة الصناعات',
      plotNumber: 'RAK-LOT-3311',
      type: 'industrial',
      status: 'delayed',
      progress: 35,
      budget: 600000,
      startDate: new Date('2024-02-15'),
      endDate: new Date('2025-02-15'),
      description: 'مصنع متعدد الأغراض مع مستودعات ومنطقة تحميل',
      createdById: adminUser.id,
    },
  });
  logger.info('✅ Demo projects created (5 projects)');

  // ========== 7. Project Assignments ==========
  await db.projectAssignment.createMany({
    data: [
      { projectId: project1.id, userId: pmUser.id, role: 'project_manager' },
      { projectId: project1.id, userId: engineerUser.id, role: 'team_member' },
      { projectId: project1.id, userId: structuralUser.id, role: 'team_member' },
      { projectId: project1.id, userId: mepUser.id, role: 'team_member' },
      { projectId: project2.id, userId: pmUser.id, role: 'project_manager' },
      { projectId: project2.id, userId: engineerUser.id, role: 'team_member' },
      { projectId: project2.id, userId: structuralUser.id, role: 'team_member' },
      { projectId: project3.id, userId: pmUser.id, role: 'project_manager' },
      { projectId: project3.id, userId: engineerUser.id, role: 'team_member' },
      { projectId: project3.id, userId: mepUser.id, role: 'team_member' },
      { projectId: project4.id, userId: adminUser.id, role: 'project_manager' },
      { projectId: project5.id, userId: pmUser.id, role: 'project_manager' },
      { projectId: project5.id, userId: structuralUser.id, role: 'team_member' },
    ],
  });
  logger.info('✅ Project assignments created');

  // ========== 8. Tasks ==========
  await db.task.createMany({
    data: [
      // Project 1 tasks
      {
        projectId: project1.id,
        title: 'إعداد المخططات المعمارية النهائية',
        description: 'مراجعة وإكمال جميع المخططات المعمارية للفيلا',
        assigneeId: engineerUser.id,
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2024-04-01'),
        dueDate: new Date('2024-05-15'),
        progress: 70,
      },
      {
        projectId: project1.id,
        title: 'تصميم مخططات الأساسات',
        description: 'تصميم مخططات الأساسات بناءً على تقرير التربة',
        assigneeId: structuralUser.id,
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2024-03-15'),
        dueDate: new Date('2024-05-01'),
        progress: 50,
      },
      {
        projectId: project1.id,
        title: 'تصميم نظام التكييف المركزي',
        description: 'إعداد مخططات ونظام التكييف المركزي للفيلا',
        assigneeId: mepUser.id,
        priority: 'medium',
        status: 'todo',
        startDate: new Date('2024-05-01'),
        dueDate: new Date('2024-06-15'),
        progress: 0,
      },
      {
        projectId: project1.id,
        title: 'تقديم المستندات للبلدية',
        description: 'تجهيز وتقديم جميع المستندات المطلوبة للبلدية',
        assigneeId: pmUser.id,
        priority: 'urgent',
        status: 'todo',
        startDate: new Date('2024-06-01'),
        dueDate: new Date('2024-06-15'),
        progress: 0,
        isGovernmental: true,
      },
      // Project 2 tasks
      {
        projectId: project2.id,
        title: 'إعداد المخططات الأولية',
        description: 'إعداد المخططات المعمارية الأولية للمبنى السكني',
        assigneeId: engineerUser.id,
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2024-03-15'),
        dueDate: new Date('2024-06-01'),
        progress: 60,
      },
      {
        projectId: project2.id,
        title: 'دراسة التربة والأساسات',
        description: 'إجراء دراسة التربة وتصميم نظام الأساسات',
        assigneeId: structuralUser.id,
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2024-04-01'),
        dueDate: new Date('2024-07-01'),
        progress: 30,
      },
      {
        projectId: project2.id,
        title: 'تصميم الأنظمة الكهربائية',
        description: 'تصميم جميع الأنظمة الكهربائية للمبنى',
        assigneeId: mepUser.id,
        priority: 'medium',
        status: 'todo',
        startDate: new Date('2024-06-01'),
        dueDate: new Date('2024-09-01'),
        progress: 0,
      },
      // Project 3 tasks
      {
        projectId: project3.id,
        title: 'مفهوم التصميم التجاري',
        description: 'إعداد مفهوم التصميم للمجمع التجاري',
        assigneeId: engineerUser.id,
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2024-06-15'),
        dueDate: new Date('2024-08-15'),
        progress: 40,
      },
      // Overdue task for alerts
      {
        projectId: project5.id,
        title: 'مراجعة التصميم الإنشائي',
        description: 'مراجعة وتحديث التصميم الإنشائي للمنشأة',
        assigneeId: structuralUser.id,
        priority: 'urgent',
        status: 'in_progress',
        startDate: new Date('2024-03-01'),
        dueDate: new Date('2024-04-01'),
        progress: 25,
      },
    ],
  });
  logger.info('✅ Demo tasks created (9 tasks)');

  // ========== 9. Invoices ==========
  await db.invoice.createMany({
    data: [
      {
        number: 'INV-2024-001',
        clientId: client1.id,
        projectId: project1.id,
        issueDate: new Date('2024-02-01'),
        dueDate: new Date('2024-03-01'),
        subtotal: 62500,
        tax: 3750,
        total: 66250,
        paidAmount: 66250,
        remaining: 0,
        status: 'paid',
      },
      {
        number: 'INV-2024-002',
        clientId: client1.id,
        projectId: project1.id,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-06-01'),
        subtotal: 62500,
        tax: 3750,
        total: 66250,
        paidAmount: 33250,
        remaining: 33000,
        status: 'partially_paid',
      },
      {
        number: 'INV-2024-003',
        clientId: client2.id,
        projectId: project2.id,
        issueDate: new Date('2024-04-01'),
        dueDate: new Date('2024-05-01'),
        subtotal: 170000,
        tax: 10200,
        total: 180200,
        paidAmount: 0,
        remaining: 180200,
        status: 'overdue',
      },
      {
        number: 'INV-2024-004',
        clientId: client2.id,
        projectId: project5.id,
        issueDate: new Date('2024-06-01'),
        dueDate: new Date('2024-07-01'),
        subtotal: 100000,
        tax: 6000,
        total: 106000,
        paidAmount: 0,
        remaining: 106000,
        status: 'sent',
      },
      {
        number: 'INV-2024-005',
        clientId: client3.id,
        projectId: project3.id,
        issueDate: new Date('2024-07-01'),
        dueDate: new Date('2024-08-01'),
        subtotal: 150000,
        tax: 9000,
        total: 159000,
        paidAmount: 0,
        remaining: 159000,
        status: 'draft',
      },
      {
        number: 'INV-2024-006',
        clientId: client4.id,
        projectId: project4.id,
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        subtotal: 180000,
        tax: 10800,
        total: 190800,
        paidAmount: 190800,
        remaining: 0,
        status: 'paid',
      },
    ],
  });
  logger.info('✅ Demo invoices created (6 invoices)');

  // ========== 10. Contracts ==========
  await db.contract.createMany({
    data: [
      {
        number: 'CTR-2024-001',
        title: 'عقد تصميم فيلا المنطقة الأولى',
        clientId: client1.id,
        projectId: project1.id,
        value: 250000,
        type: 'engineering_services',
        status: 'active',
        signedByName: 'محمد بن راشد',
        signedByTitle: 'المدير التنفيذي',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-30'),
      },
      {
        number: 'CTR-2024-002',
        title: 'عقد تصميم المبنى السكني',
        clientId: client2.id,
        projectId: project2.id,
        value: 850000,
        type: 'engineering_services',
        status: 'active',
        signedByName: 'أحمد الشامسي',
        signedByTitle: 'رئيس مجلس الإدارة',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-06-30'),
      },
      {
        number: 'CTR-2024-003',
        title: 'عقد الاستشارات الهندسية - المجمع التجاري',
        clientId: client3.id,
        projectId: project3.id,
        value: 1200000,
        type: 'consulting',
        status: 'pending_signature',
        signedByName: 'سعاد الكتبي',
        signedByTitle: 'مديرة التطوير',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-12-31'),
      },
    ],
  });
  logger.info('✅ Demo contracts created (3 contracts)');

  // ========== 11. Site Visits ==========
  await db.siteVisit.createMany({
    data: [
      {
        projectId: project1.id,
        date: new Date('2024-04-15'),
        plotNumber: 'RKN-LOT-4521',
        municipality: 'dubai',
        gateDescription: 'بوابة رئيسية من الشارع مع باب جانبي',
        neighborDesc: 'فيلا مجاورة من الجهة الشرقية وأرض فارغة غرباً',
        buildingDesc: 'أرض فضاء 800م² مع أساسات خرسانية قديمة',
        status: 'approved',
      },
      {
        projectId: project2.id,
        date: new Date('2024-04-20'),
        plotNumber: 'ADH-LOT-7892',
        municipality: 'abu_dhabi',
        gateDescription: 'مدخل رئيسي من شارعين',
        neighborDesc: 'مبنى سكني شمالاً ومحل تجاري جنوباً',
        buildingDesc: 'أرض 2500م² مسطحة مع خدمات أساسية',
        status: 'submitted',
      },
      {
        projectId: project5.id,
        date: new Date('2024-03-10'),
        plotNumber: 'RAK-LOT-3311',
        municipality: 'ras_al_khaimah',
        gateDescription: 'بوابة صناعية مع منطقة تحميل',
        neighborDesc: 'مصنعان مجاوران من الجهة الشرقية والغربية',
        buildingDesc: 'أرض صناعية 5000م² مع مباني مخازن قديمة',
        status: 'approved',
      },
    ],
  });
  logger.info('✅ Demo site visits created (3 visits)');

  // ========== 12. Project Stages ==========
  const stages = [
    // Project 1 - Architectural
    { projectId: project1.id, department: 'architectural', stageName: 'مفهوم التصميم', stageOrder: 1, status: 'APPROVED' },
    { projectId: project1.id, department: 'architectural', stageName: 'تطوير المخططات', stageOrder: 2, status: 'IN_PROGRESS' },
    { projectId: project1.id, department: 'architectural', stageName: 'المستندات الأولية', stageOrder: 3, status: 'NOT_STARTED' },
    { projectId: project1.id, department: 'architectural', stageName: 'التصيير ثلاثي الأبعاد', stageOrder: 4, status: 'NOT_STARTED' },
    // Project 1 - Structural
    { projectId: project1.id, department: 'structural', stageName: 'تقرير التربة', stageOrder: 1, status: 'APPROVED' },
    { projectId: project1.id, department: 'structural', stageName: 'مخطط الأساسات', stageOrder: 2, status: 'IN_PROGRESS' },
    { projectId: project1.id, department: 'structural', stageName: 'العتلات والأعمدة', stageOrder: 3, status: 'NOT_STARTED' },
    // Project 2 - Architectural
    { projectId: project2.id, department: 'architectural', stageName: 'مفهوم التصميم', stageOrder: 1, status: 'APPROVED' },
    { projectId: project2.id, department: 'architectural', stageName: 'تطوير المخططات', stageOrder: 2, status: 'IN_PROGRESS' },
    // Project 2 - Structural
    { projectId: project2.id, department: 'structural', stageName: 'تقرير التربة', stageOrder: 1, status: 'IN_PROGRESS' },
  ];
  for (const stage of stages) {
    await db.projectStage.create({ data: stage });
  }
  logger.info('✅ Project stages created');

  // ========== 13. Government Approvals ==========
  await db.govApproval.createMany({
    data: [
      {
        projectId: project1.id,
        authority: 'MUN',
        status: 'SUBMITTED',
        submissionDate: new Date('2024-05-01'),
      },
      {
        projectId: project2.id,
        authority: 'MUN',
        status: 'PENDING',
      },
      {
        projectId: project1.id,
        authority: 'FEWA',
        status: 'PENDING',
      },
    ],
  });
  logger.info('✅ Government approvals created');

  // ========== 14. Meetings ==========
  await db.meeting.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'اجتماع مراجعة التصميم المعماري',
        date: new Date('2024-05-20'),
        time: '10:00',
        duration: 90,
        location: 'مكتب بلوبرنت - غرفة الاجتماعات',
        type: 'onsite',
        notes: 'مراجعة المخططات المعمارية مع العميل',
      },
      {
        projectId: project2.id,
        title: 'اجتماع متابعة المشروع',
        date: new Date('2024-06-10'),
        time: '14:00',
        duration: 60,
        location: 'أونلاين - Zoom',
        type: 'online',
        notes: 'متابعة تقدم المشروع ومناقشة التحديات',
      },
      {
        title: 'اجتماع الفريق الأسبوعي',
        date: new Date('2024-06-15'),
        time: '09:00',
        duration: 45,
        location: 'مكتب بلوبرنت',
        type: 'onsite',
        notes: 'مراجعة أحمال العمل والمهام الأسبوعية',
      },
    ],
  });
  logger.info('✅ Meetings created (3 meetings)');

  // ========== 15. Suppliers ==========
  await db.supplier.createMany({
    data: [
      {
        name: 'شركة الخليج للمواد الإنشائية',
        category: 'materials',
        email: 'sales@gulf-concrete.ae',
        phone: '+971-7-222-3344',
        address: 'رأس الخيمة',
        rating: 4,
        creditLimit: 200000,
      },
      {
        name: 'الأفق لأنظمة التكييف',
        category: 'equipment',
        email: 'info@alofaq-ac.ae',
        phone: '+971-4-333-4455',
        address: 'دبي',
        rating: 5,
        creditLimit: 350000,
      },
      {
        name: 'النور للأنظمة الكهربائية',
        category: 'materials',
        email: 'orders@alnoor-electric.ae',
        phone: '+971-2-444-5566',
        address: 'أبو ظبي',
        rating: 4,
        creditLimit: 150000,
      },
    ],
  });
  logger.info('✅ Suppliers created (3 suppliers)');

  // ========== 16. Site Diaries ==========
  await db.siteDiary.createMany({
    data: [
      {
        projectId: project1.id,
        date: new Date('2024-05-10'),
        weather: 'مشمس، 38°C',
        workerCount: 12,
        workDescription: 'صب الخرسانة للأساسات - المرحلة الثانية',
        issues: 'تأخر وصول الحديد ساعة واحدة',
        safetyNotes: 'تم التأكد من معدات السلامة لجميع العمال',
        equipment: 'خلاطة خرسانة، رافعة برجية',
        materials: '50 طن حديد تسليح، 120 م³ خرسانة',
      },
      {
        projectId: project2.id,
        date: new Date('2024-05-12'),
        weather: 'غائم جزئياً، 34°C',
        workerCount: 8,
        workDescription: 'الحفر وتجهيز موقع الأساسات',
        issues: 'تم اكتشاف صخور صلبة في المنطقة الشرقية',
        safetyNotes: 'تم إيقاف العمل مؤقتاً بسبب هطول أمطار خفيفة',
        equipment: 'حفارة، شاحنة نقل',
        materials: 'لا يوجد',
      },
    ],
  });
  logger.info('✅ Site diaries created');

  // ========== 17. Proposals ==========
  await db.proposal.createMany({
    data: [
      {
        number: 'PRP-2024-001',
        clientId: client3.id,
        projectId: project3.id,
        subtotal: 1200000,
        tax: 72000,
        total: 1272000,
        status: 'sent',
        notes: 'عرض أسعار شامل التصميم والإشراف',
      },
    ],
  });
  logger.info('✅ Proposals created');

  // ========== 18. Knowledge Articles ==========
  await db.knowledgeArticle.createMany({
    data: [
      {
        title: 'دليل إعداد مستندات البلدية',
        content: 'خطوات إعداد وتقديم المستندات المطلوبة للموافقة البلدية في الإمارات...',
        category: 'guide',
        tags: 'بلدية,موافقات,مستندات',
        views: 45,
        authorId: adminUser.id,
      },
      {
        title: 'معايير تصميم الفلل في دبي',
        content: 'المتطلبات والمعايير الخاصة بتصميم الفلل وفقاً لأنظمة بلدية دبي...',
        category: 'guide',
        tags: 'فلل,تصميم,دبي,معايير',
        views: 32,
        authorId: engineerUser.id,
      },
      {
        title: 'الأسئلة الشائعة حول أنظمة الدفاع المدني',
        content: 'إجابات على الأسئلة الأكثر شيوعاً حول متطلبات الدفاع المدني...',
        category: 'faq',
        tags: 'دفاع_مدني,سلامة,أسئلة',
        views: 28,
        authorId: mepUser.id,
      },
    ],
  });
  logger.info('✅ Knowledge articles created');

  // ========== 19. Schedule Phases ==========
  const schedulePhases = [
    // Project 1 - Architectural schedule
    { projectId: project1.id, section: 'architectural', phaseOrder: 1, phaseName: 'المخطط المبدئي', duration: 14, maxDuration: 21, status: 'COMPLETED', startDate: new Date('2024-01-15'), endDate: new Date('2024-01-29') },
    { projectId: project1.id, section: 'architectural', phaseOrder: 2, phaseName: 'تطوير التصميم', duration: 30, maxDuration: 50, status: 'IN_PROGRESS', startDate: new Date('2024-01-30'), endDate: new Date('2024-03-01') },
    { projectId: project1.id, section: 'architectural', phaseOrder: 3, phaseName: 'المخططات النهائية', duration: 25, maxDuration: 40, status: 'NOT_STARTED' },
    { projectId: project1.id, section: 'architectural', phaseOrder: 4, phaseName: 'الموافقة البلدية', duration: 30, maxDuration: 50, status: 'NOT_STARTED' },
    // Project 1 - Structural schedule
    { projectId: project1.id, section: 'structural', phaseOrder: 1, phaseName: 'دراسة التربة', duration: 10, maxDuration: 21, status: 'COMPLETED' },
    { projectId: project1.id, section: 'structural', phaseOrder: 2, phaseName: 'تصميم الأساسات', duration: 20, maxDuration: 35, status: 'IN_PROGRESS' },
    { projectId: project1.id, section: 'structural', phaseOrder: 3, phaseName: 'تصميم الهيكل', duration: 25, maxDuration: 40, status: 'NOT_STARTED' },
    // Project 1 - Governmental
    { projectId: project1.id, section: 'governmental', phaseOrder: 1, phaseName: 'تقديم البلدية', duration: 5, maxDuration: 7, status: 'COMPLETED' },
    { projectId: project1.id, section: 'governmental', phaseOrder: 2, phaseName: 'مراجعة البلدية', duration: 30, maxDuration: 50, status: 'IN_PROGRESS' },
  ];
  for (const phase of schedulePhases) {
    await db.schedulePhase.create({ data: phase });
  }
  logger.info('✅ Schedule phases created');

  // ========== 20. BOQ Items ==========
  await db.bOQItem.createMany({
    data: [
      { projectId: project1.id, code: 'CIV-001', description: 'حفر أساسات', unit: 'م³', quantity: 250, unitPrice: 45, total: 11250, category: 'civil' },
      { projectId: project1.id, code: 'CIV-002', description: 'صب خرسانة للأساسات', unit: 'م³', quantity: 180, unitPrice: 280, total: 50400, category: 'civil' },
      { projectId: project1.id, code: 'STL-001', description: 'حديد تسليح #12-32', unit: 'طن', quantity: 35, unitPrice: 3500, total: 122500, category: 'structural' },
      { projectId: project1.id, code: 'FIN-001', description: 'بلاط أرضيات رخام', unit: 'م²', quantity: 450, unitPrice: 180, total: 81000, category: 'finishing' },
      { projectId: project1.id, code: 'ELC-001', description: 'لوحة توزيع رئيسية', unit: 'لوحة', quantity: 1, unitPrice: 8500, total: 8500, category: 'electrical' },
    ],
  });
  logger.info('✅ BOQ items created');

  // ========== 21. Notifications ==========
  await db.notification.createMany({
    data: [
      // 3 unread notifications for admin
      {
        userId: adminUser.id,
        type: 'invoice_overdue',
        title: 'فاتورة متأخرة',
        message: 'فاتورة INV-2024-003 للمشروع "مبنى سكني متعدد الطوابق" تجاوزت تاريخ الاستحقاق - المبلغ: 180,200 درهم',
        isRead: false,
        relatedEntityType: 'invoice',
        relatedEntityId: 'INV-2024-003',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        type: 'approval_needed',
        title: 'موافقة مطلوبة',
        message: 'طلب إجازة من سارة علي بانتظار موافقتك - إجازة سنوية من 01/07/2024 إلى 05/07/2024',
        isRead: false,
        relatedEntityType: 'leave',
        relatedEntityId: 'leave-pending-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        type: 'task_deadline',
        title: 'مهمة متأخرة',
        message: 'مهمة "مراجعة التصميم الإنشائي" في مشروع "منشأة صناعية" تجاوزت الموعد النهائي بتاريخ 01/04/2024',
        isRead: false,
        relatedEntityType: 'task',
        relatedEntityId: 'task-overdue-1',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      // 2 read notifications for admin
      {
        userId: adminUser.id,
        type: 'project_update',
        title: 'تحديث المشروع',
        message: 'تم تحديث تقدم مشروع "فيلا فاخرة - المنطقة الأولى" إلى 65%',
        isRead: true,
        relatedEntityType: 'project',
        relatedEntityId: project1.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        type: 'payment_received',
        title: 'دفعة مستلمة',
        message: 'تم استلام دفعة بقيمة 33,250 درهم من شركة الإعمار العقارية - فاتورة INV-2024-002',
        isRead: true,
        relatedEntityType: 'invoice',
        relatedEntityId: 'INV-2024-002',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  logger.info('✅ Demo notifications created (5 notifications)');

  logger.info('\n🎉 BluePrint database seeded successfully!');
  logger.info('📧 Admin login: admin@blueprint.ae (check console for password)');
  logger.info('⚠️  Passwords are randomly generated. Check the seed output above for credentials.');
  logger.info('📊 Summary:');
  logger.info('   - 18 users (1 admin, 1 PM, 8 engineers, 1 accountant, 1 secretary, 1 HR, 1 viewer, 4 legacy users)');
  logger.info('   - 5 employees');
  logger.info('   - 4 clients');
  logger.info('   - 5 projects (3 active, 1 completed, 1 delayed)');
  logger.info('   - 9 tasks');
  logger.info('   - 6 invoices');
  logger.info('   - 3 contracts');
  logger.info('   - 3 site visits');
  logger.info('   - 3 meetings');
  logger.info('   - 3 suppliers');
  logger.info('   - 2 site diaries');
  logger.info('   - 3 knowledge articles');
  logger.info('   - 1 proposal');
  logger.info('   - 5 notifications (3 unread, 2 read)');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await db.$disconnect();
    process.exit(1);
  });
