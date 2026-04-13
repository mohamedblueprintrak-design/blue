import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * Generate a secure random password
 * SECURITY: Used for initial seed users instead of hardcoded passwords
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

/**
 * POST /api/init - Auto-initialize database with seed data if empty
 * Called by the login page on mount to ensure the database has at least the admin user
 */
export async function POST() {
  try {
    // Check if any users exist
    const userCount = await db.user.count();

    if (userCount > 0) {
      return NextResponse.json({
        initialized: true,
        message: 'Database already has users',
        userCount,
      });
    }

    console.log('🌱 Auto-seeding database (no users found)...');

    const adminPassword = generateSecurePassword();
    const adminHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await db.user.create({
      data: {
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

    // Create additional demo users (emails match login page ROLES)
    const usersData = [
      { email: 'pm@blueprint.ae', name: 'عمر يوسف', phone: '+971-50-678-9012', role: 'project_manager' as const, department: 'إدارة المشاريع', position: 'مدير مشاريع' },
      { email: 'eng@blueprint.ae', name: 'أحمد محمد', phone: '+971-50-234-5678', role: 'engineer' as const, department: 'القسم المعماري', position: 'مهندس معماري أول' },
      { email: 'acc@blueprint.ae', name: 'فاطمة حسن', phone: '+971-50-567-8901', role: 'accountant' as const, department: 'المالية', position: 'محاسبة' },
      { email: 'hr@blueprint.ae', name: 'سارة علي', phone: '+971-50-345-6789', role: 'hr' as const, department: 'الموارد البشرية', position: 'مدير الموارد البشرية' },
      { email: 'sec@blueprint.ae', name: 'خالد سعيد', phone: '+971-50-456-7890', role: 'secretary' as const, department: 'السكرتارية', position: 'سكرتير تنفيذي' },
    ];

    const createdUsers = [adminUser];
    for (const u of usersData) {
      const hash = await bcrypt.hash(generateSecurePassword(), 10);
      const user = await db.user.create({ data: { ...u, password: hash, isActive: true } });
      createdUsers.push(user);
    }

    // Create company settings
    try {
      await db.companySettings.create({
        data: {
          id: 'default-company',
          name: 'بلوبرنت للاستشارات الهندسية',
          nameEn: 'BluePrint Engineering Consultancy',
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
    } catch {
      // May already exist, ignore
    }

    // Create employees
    const empData = [
      { id: 'emp-admin', userId: adminUser.id, department: 'الإدارة', position: 'مدير عام', salary: 35000, hireDate: new Date('2020-01-15') },
      { id: 'emp-ahmed', userId: createdUsers[1]?.id, department: 'القسم المعماري', position: 'مهندس معماري أول', salary: 22000, hireDate: new Date('2021-03-01') },
      { id: 'emp-sara', userId: createdUsers[2]?.id, department: 'القسم الإنشائي', position: 'مهندسة إنشائية', salary: 20000, hireDate: new Date('2022-06-15') },
      { id: 'emp-khalid', userId: createdUsers[3]?.id, department: 'القسم الكهروميكانيكي', position: 'مهندس كهربائي', salary: 20000, hireDate: new Date('2021-09-01') },
      { id: 'emp-omar', userId: createdUsers[4]?.id, department: 'إدارة المشاريع', position: 'مدير مشاريع', salary: 28000, hireDate: new Date('2020-06-01') },
    ];
    for (const e of empData) {
      if (!e.userId) continue;
      try {
        await db.employee.create({ data: { ...e, employmentStatus: 'active' } });
      } catch {
        // May already exist
      }
    }

    // Create demo clients
    let clients: { id: string }[] = [];
    try {
      const clientData = [
        { name: 'محمد بن راشد', company: 'شركة الإعمار العقارية', email: 'mbinrashid@almouj.ae', phone: '+971-50-111-2233', address: 'دبي', taxNumber: '200000000000000', creditLimit: 500000, paymentTerms: '30 days' },
        { name: 'أحمد الشامسي', company: 'مجموعة الشامسي القابضة', email: 'info@shamsigroup.ae', phone: '+971-50-444-5566', address: 'أبو ظبي', taxNumber: '300000000000000', creditLimit: 1000000, paymentTerms: '45 days' },
        { name: 'سعاد الكتبي', company: 'تطوير المشاريع المتقدمة', email: 'projects@advanced-dev.ae', phone: '+971-50-777-8899', address: 'رأس الخيمة', taxNumber: '400000000000000', creditLimit: 300000, paymentTerms: 'Net 30' },
        { name: 'ناصر العتيبي', company: 'شركة النخبة للاستثمار', email: 'nasser@nukhba.ae', phone: '+971-50-222-3344', address: 'الشارقة', taxNumber: '500000000000000', creditLimit: 750000, paymentTerms: '60 days' },
      ];
      clients = await Promise.all(clientData.map(c => db.client.create({ data: c })));
    } catch {
      clients = await db.client.findMany({ take: 4 });
    }

    // Create demo projects
    let projects: { id: string }[] = [];
    if (clients.length >= 4 && createdUsers.length >= 5) {
      try {
        const projectData = [
          { number: 'PRJ-2024-001', name: 'فيلا فاخرة - المنطقة الأولى', nameEn: 'Luxury Villa', clientId: clients[0].id, location: 'دبي', type: 'villa', status: 'active', progress: 65, budget: 250000, startDate: new Date('2024-01-15'), endDate: new Date('2024-12-30'), description: 'تصميم وبناء فيلا فاخرة', createdById: adminUser.id },
          { number: 'PRJ-2024-002', name: 'مبنى سكني متعدد الطوابق', nameEn: 'Residential Building', clientId: clients[1].id, location: 'أبو ظبي', type: 'building', status: 'active', progress: 40, budget: 850000, startDate: new Date('2024-03-01'), endDate: new Date('2025-06-30'), description: 'مبنى سكني 12 طابق', createdById: createdUsers[4]?.id || adminUser.id },
          { number: 'PRJ-2024-003', name: 'مجمع تجاري - المنطقة الحرة', nameEn: 'Commercial Complex', clientId: clients[2].id, location: 'رأس الخيمة', type: 'commercial', status: 'active', progress: 20, budget: 1200000, startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31'), description: 'مجمع تجاري متعدد الاستخدامات', createdById: createdUsers[4]?.id || adminUser.id },
          { number: 'PRJ-2024-004', name: 'فيلا عائلية', nameEn: 'Family Villa', clientId: clients[3].id, location: 'الشارقة', type: 'villa', status: 'completed', progress: 100, budget: 180000, startDate: new Date('2023-06-01'), endDate: new Date('2024-03-15'), description: 'فيلا عائلية من طابق واحد', createdById: adminUser.id },
          { number: 'PRJ-2024-005', name: 'منشأة صناعية', nameEn: 'Industrial Facility', clientId: clients[1].id, location: 'رأس الخيمة', type: 'industrial', status: 'delayed', progress: 35, budget: 600000, startDate: new Date('2024-02-15'), endDate: new Date('2025-02-15'), description: 'مصنع متعدد الأغراض', createdById: adminUser.id },
        ];
        projects = await Promise.all(projectData.map(p => db.project.create({ data: p })));
      } catch {
        projects = await db.project.findMany({ take: 5 });
      }
    }

    // Create demo tasks
    if (projects.length >= 5 && createdUsers.length >= 5) {
      try {
        await db.task.createMany({
          data: [
            { projectId: projects[0].id, title: 'إعداد المخططات المعمارية النهائية', description: 'مراجعة وإكمال جميع المخططات', assigneeId: createdUsers[1]?.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-04-01'), dueDate: new Date('2024-05-15'), progress: 70 },
            { projectId: projects[0].id, title: 'تصميم مخططات الأساسات', description: 'تصميم الأساسات بناءً على تقرير التربة', assigneeId: createdUsers[2]?.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-03-15'), dueDate: new Date('2024-05-01'), progress: 50 },
            { projectId: projects[0].id, title: 'تصميم نظام التكييف المركزي', description: 'إعداد مخططات التكييف', assigneeId: createdUsers[3]?.id, priority: 'medium', status: 'todo', startDate: new Date('2024-05-01'), dueDate: new Date('2024-06-15'), progress: 0 },
            { projectId: projects[0].id, title: 'تقديم المستندات للبلدية', description: 'تجهيز وتقديم المستندات', assigneeId: createdUsers[4]?.id, priority: 'urgent', status: 'todo', startDate: new Date('2024-06-01'), dueDate: new Date('2024-06-15'), progress: 0, isGovernmental: true },
            { projectId: projects[1].id, title: 'إعداد المخططات الأولية', description: 'المخططات الأولية للمبنى', assigneeId: createdUsers[1]?.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-03-15'), dueDate: new Date('2024-06-01'), progress: 60 },
            { projectId: projects[1].id, title: 'دراسة التربة والأساسات', description: 'دراسة التربة وتصميم الأساسات', assigneeId: createdUsers[2]?.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-04-01'), dueDate: new Date('2024-07-01'), progress: 30 },
            { projectId: projects[2].id, title: 'مفهوم التصميم التجاري', description: 'إعداد مفهوم التصميم', assigneeId: createdUsers[1]?.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-06-15'), dueDate: new Date('2024-08-15'), progress: 40 },
            { projectId: projects[4].id, title: 'مراجعة التصميم الإنشائي', description: 'مراجعة وتحديث التصميم', assigneeId: createdUsers[2]?.id, priority: 'urgent', status: 'in_progress', startDate: new Date('2024-03-01'), dueDate: new Date('2024-04-01'), progress: 25 },
          ],
        });
      } catch {
        // Tasks may already exist
      }
    }

    // Create demo invoices
    if (clients.length >= 4 && projects.length >= 5) {
      try {
        await db.invoice.createMany({
          data: [
            { number: 'INV-2024-001', clientId: clients[0].id, projectId: projects[0].id, issueDate: new Date('2024-02-01'), dueDate: new Date('2024-03-01'), subtotal: 62500, tax: 3750, total: 66250, paidAmount: 66250, remaining: 0, status: 'paid' },
            { number: 'INV-2024-002', clientId: clients[0].id, projectId: projects[0].id, issueDate: new Date('2024-05-01'), dueDate: new Date('2024-06-01'), subtotal: 62500, tax: 3750, total: 66250, paidAmount: 33250, remaining: 33000, status: 'partially_paid' },
            { number: 'INV-2024-003', clientId: clients[1].id, projectId: projects[1].id, issueDate: new Date('2024-04-01'), dueDate: new Date('2024-05-01'), subtotal: 170000, tax: 10200, total: 180200, paidAmount: 0, remaining: 180200, status: 'overdue' },
            { number: 'INV-2024-004', clientId: clients[1].id, projectId: projects[4].id, issueDate: new Date('2024-06-01'), dueDate: new Date('2024-07-01'), subtotal: 100000, tax: 6000, total: 106000, paidAmount: 0, remaining: 106000, status: 'sent' },
            { number: 'INV-2024-005', clientId: clients[2].id, projectId: projects[2].id, issueDate: new Date('2024-07-01'), dueDate: new Date('2024-08-01'), subtotal: 150000, tax: 9000, total: 159000, paidAmount: 0, remaining: 159000, status: 'draft' },
            { number: 'INV-2024-006', clientId: clients[3].id, projectId: projects[3].id, issueDate: new Date('2024-01-15'), dueDate: new Date('2024-02-15'), subtotal: 180000, tax: 10800, total: 190800, paidAmount: 190800, remaining: 0, status: 'paid' },
          ],
        });
      } catch {
        // Invoices may already exist
      }
    }

    // Create demo contracts
    if (clients.length >= 3 && projects.length >= 3) {
      try {
        await db.contract.createMany({
          data: [
            { number: 'CTR-2024-001', title: 'عقد تصميم فيلا المنطقة الأولى', clientId: clients[0].id, projectId: projects[0].id, value: 250000, type: 'engineering_services', status: 'active', signedByName: 'محمد بن راشد', signedByTitle: 'المدير التنفيذي', startDate: new Date('2024-01-15'), endDate: new Date('2024-12-30') },
            { number: 'CTR-2024-002', title: 'عقد تصميم المبنى السكني', clientId: clients[1].id, projectId: projects[1].id, value: 850000, type: 'engineering_services', status: 'active', signedByName: 'أحمد الشامسي', signedByTitle: 'رئيس مجلس الإدارة', startDate: new Date('2024-03-01'), endDate: new Date('2025-06-30') },
            { number: 'CTR-2024-003', title: 'عقد الاستشارات الهندسية', clientId: clients[2].id, projectId: projects[2].id, value: 1200000, type: 'consulting', status: 'pending_signature', signedByName: 'سعاد الكتبي', signedByTitle: 'مديرة التطوير', startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31') },
          ],
        });
      } catch {
        // Contracts may already exist
      }
    }

    // Create demo notifications
    try {
      await db.notification.createMany({
        data: [
          { userId: adminUser.id, type: 'invoice_overdue', title: 'فاتورة متأخرة', message: 'فاتورة INV-2024-003 تجاوزت تاريخ الاستحقاق - 180,200 درهم', isRead: false, relatedEntityType: 'invoice', createdAt: new Date(Date.now() - 2 * 86400000) },
          { userId: adminUser.id, type: 'approval_needed', title: 'موافقة مطلوبة', message: 'طلب إجازة بانتظار موافقتك', isRead: false, relatedEntityType: 'leave', createdAt: new Date(Date.now() - 86400000) },
          { userId: adminUser.id, type: 'task_deadline', title: 'مهمة متأخرة', message: 'مهمة مراجعة التصميم الإنشائي تجاوزت الموعد النهائي', isRead: false, relatedEntityType: 'task', createdAt: new Date(Date.now() - 6 * 3600000) },
          { userId: adminUser.id, type: 'project_update', title: 'تحديث المشروع', message: 'تم تحديث تقدم مشروع فيلا فاخرة إلى 65%', isRead: true, relatedEntityType: 'project', createdAt: new Date(Date.now() - 5 * 86400000) },
          { userId: adminUser.id, type: 'payment_received', title: 'دفعة مستلمة', message: 'تم استلام دفعة 33,250 درهم', isRead: true, relatedEntityType: 'invoice', createdAt: new Date(Date.now() - 7 * 86400000) },
        ],
      });
    } catch {
      // Notifications may already exist
    }

    // Create demo suppliers
    try {
      await db.supplier.createMany({
        data: [
          { name: 'شركة الخليج للمواد الإنشائية', category: 'materials', email: 'sales@gulf-concrete.ae', phone: '+971-7-222-3344', address: 'رأس الخيمة', rating: 4, creditLimit: 200000 },
          { name: 'الأفق لأنظمة التكييف', category: 'equipment', email: 'info@alofaq-ac.ae', phone: '+971-4-333-4455', address: 'دبي', rating: 5, creditLimit: 350000 },
          { name: 'النور للأنظمة الكهربائية', category: 'materials', email: 'orders@alnoor-electric.ae', phone: '+971-2-444-5566', address: 'أبو ظبي', rating: 4, creditLimit: 150000 },
        ],
      });
    } catch {
      // Suppliers may already exist
    }

    console.log('✅ Auto-seed completed successfully');
    // SECURITY: Log admin password to server console only (never in API response)
    console.log(`📧 Admin credentials: admin@blueprint.ae / ${adminPassword}`);

    return NextResponse.json({
      initialized: true,
      message: 'Database initialized with demo data. Check server console for admin credentials.',
      userCount: createdUsers.length,
      adminEmail: 'admin@blueprint.ae',
      // Password is logged to server console only — never returned in API response for security
    });
  } catch (error) {
    console.error('❌ Auto-init error:', error);
    return NextResponse.json(
      { error: 'Initialization failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({
      initialized: userCount > 0,
      userCount,
    });
  } catch {
    return NextResponse.json({ initialized: false, userCount: 0 });
  }
}
