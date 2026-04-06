import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

/**
 * BluePrint Combined Seed Script
 * Runs both main seed data and approval/comment seed data
 */

async function main() {
  console.log('🌱 Seeding BluePrint database...\n');

  // ========== 1. Admin User ==========
  const adminHash = await bcrypt.hash('admin123', 10);
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
  console.log('✅ Admin user created');

  const engineerHash = await bcrypt.hash('admin123', 10);
  const engineerUser = await db.user.upsert({
    where: { email: 'eng@blueprint.ae' },
    update: { password: engineerHash },
    create: {
      email: 'eng@blueprint.ae', password: engineerHash, name: 'أحمد محمد',
      phone: '+971-50-234-5678', role: 'engineer', department: 'القسم المعماري', position: 'مهندس معماري أول', isActive: true,
    },
  });

  const structuralHash = await bcrypt.hash('admin123', 10);
  const structuralUser = await db.user.upsert({
    where: { email: 'hr@blueprint.ae' },
    update: { password: structuralHash },
    create: {
      email: 'hr@blueprint.ae', password: structuralHash, name: 'سارة علي',
      phone: '+971-50-345-6789', role: 'hr', department: 'الموارد البشرية', position: 'مدير الموارد البشرية', isActive: true,
    },
  });

  const mepHash = await bcrypt.hash('admin123', 10);
  const mepUser = await db.user.upsert({
    where: { email: 'sec@blueprint.ae' },
    update: { password: mepHash },
    create: {
      email: 'sec@blueprint.ae', password: mepHash, name: 'خالد سعيد',
      phone: '+971-50-456-7890', role: 'secretary', department: 'السكرتارية', position: 'سكرتير تنفيذي', isActive: true,
    },
  });

  const accountantHash = await bcrypt.hash('admin123', 10);
  const accountantUser = await db.user.upsert({
    where: { email: 'acc@blueprint.ae' },
    update: { password: accountantHash },
    create: {
      email: 'acc@blueprint.ae', password: accountantHash, name: 'فاطمة حسن',
      phone: '+971-50-567-8901', role: 'accountant', department: 'المالية', position: 'محاسبة', isActive: true,
    },
  });

  const pmHash = await bcrypt.hash('admin123', 10);
  const pmUser = await db.user.upsert({
    where: { email: 'pm@blueprint.ae' },
    update: { password: pmHash },
    create: {
      email: 'pm@blueprint.ae', password: pmHash, name: 'عمر يوسف',
      phone: '+971-50-678-9012', role: 'project_manager', department: 'إدارة المشاريع', position: 'مدير مشاريع', isActive: true,
    },
  });
  console.log('✅ 6 demo users created');

  // ========== Company Settings ==========
  await db.companySettings.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company', name: 'بلوبرنت للاستشارات الهندسية', nameEn: 'BluePrint Engineering Consultancy',
      email: 'info@blueprint.ae', phone: '+971-7-234-5678', address: 'رأس الخيمة، الإمارات العربية المتحدة',
      taxNumber: '100000000000000', currency: 'AED', timezone: 'Asia/Dubai', workingDays: 'sun,thu', workingHours: '07:30-16:30',
    },
  });

  // ========== Employees ==========
  const empData = [
    { id: 'emp-admin', userId: adminUser.id, department: 'الإدارة', position: 'مدير عام', salary: 35000, hireDate: new Date('2020-01-15') },
    { id: 'emp-ahmed', userId: engineerUser.id, department: 'القسم المعماري', position: 'مهندس معماري أول', salary: 22000, hireDate: new Date('2021-03-01') },
    { id: 'emp-sara', userId: structuralUser.id, department: 'القسم الإنشائي', position: 'مهندسة إنشائية', salary: 20000, hireDate: new Date('2022-06-15') },
    { id: 'emp-khalid', userId: mepUser.id, department: 'القسم الكهروميكانيكي', position: 'مهندس كهربائي', salary: 20000, hireDate: new Date('2021-09-01') },
    { id: 'emp-omar', userId: pmUser.id, department: 'إدارة المشاريع', position: 'مدير مشاريع', salary: 28000, hireDate: new Date('2020-06-01') },
  ];
  for (const e of empData) {
    await db.employee.upsert({ where: { id: e.id }, update: {}, create: { ...e, employmentStatus: 'active' } });
  }

  // ========== Clients ==========
  const client1 = await db.client.create({ data: { name: 'محمد بن راشد', company: 'شركة الإعمار العقارية', email: 'mbinrashid@almouj.ae', phone: '+971-50-111-2233', address: 'دبي', taxNumber: '200000000000000', creditLimit: 500000, paymentTerms: '30 days' } });
  const client2 = await db.client.create({ data: { name: 'أحمد الشامسي', company: 'مجموعة الشامسي القابضة', email: 'info@shamsigroup.ae', phone: '+971-50-444-5566', address: 'أبو ظبي', taxNumber: '300000000000000', creditLimit: 1000000, paymentTerms: '45 days' } });
  const client3 = await db.client.create({ data: { name: 'سعاد الكتبي', company: 'تطوير المشاريع المتقدمة', email: 'projects@advanced-dev.ae', phone: '+971-50-777-8899', address: 'رأس الخيمة', taxNumber: '400000000000000', creditLimit: 300000, paymentTerms: 'Net 30' } });
  const client4 = await db.client.create({ data: { name: 'ناصر العتيبي', company: 'شركة النخبة للاستثمار', email: 'nasser@nukhba.ae', phone: '+971-50-222-3344', address: 'الشارقة', taxNumber: '500000000000000', creditLimit: 750000, paymentTerms: '60 days' } });

  // ========== Projects ==========
  const project1 = await db.project.create({ data: { number: 'PRJ-2024-001', name: 'فيلا فاخرة - المنطقة الأولى', nameEn: 'Luxury Villa', clientId: client1.id, location: 'دبي', type: 'villa', status: 'active', progress: 65, budget: 250000, startDate: new Date('2024-01-15'), endDate: new Date('2024-12-30'), description: 'تصميم وبناء فيلا فاخرة', createdById: adminUser.id } });
  const project2 = await db.project.create({ data: { number: 'PRJ-2024-002', name: 'مبنى سكني متعدد الطوابق', nameEn: 'Residential Building', clientId: client2.id, location: 'أبو ظبي', type: 'building', status: 'active', progress: 40, budget: 850000, startDate: new Date('2024-03-01'), endDate: new Date('2025-06-30'), description: 'مبنى سكني 12 طابق', createdById: pmUser.id } });
  const project3 = await db.project.create({ data: { number: 'PRJ-2024-003', name: 'مجمع تجاري - المنطقة الحرة', nameEn: 'Commercial Complex', clientId: client3.id, location: 'رأس الخيمة', type: 'commercial', status: 'active', progress: 20, budget: 1200000, startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31'), description: 'مجمع تجاري متعدد الاستخدامات', createdById: pmUser.id } });
  const project4 = await db.project.create({ data: { number: 'PRJ-2024-004', name: 'فيلا عائلية', nameEn: 'Family Villa', clientId: client4.id, location: 'الشارقة', type: 'villa', status: 'completed', progress: 100, budget: 180000, startDate: new Date('2023-06-01'), endDate: new Date('2024-03-15'), description: 'فيلا عائلية من طابق واحد', createdById: adminUser.id } });
  const project5 = await db.project.create({ data: { number: 'PRJ-2024-005', name: 'منشأة صناعية', nameEn: 'Industrial Facility', clientId: client2.id, location: 'رأس الخيمة', type: 'industrial', status: 'delayed', progress: 35, budget: 600000, startDate: new Date('2024-02-15'), endDate: new Date('2025-02-15'), description: 'مصنع متعدد الأغراض', createdById: adminUser.id } });

  // ========== Project Assignments ==========
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

  // ========== Tasks ==========
  await db.task.createMany({
    data: [
      { projectId: project1.id, title: 'إعداد المخططات المعمارية النهائية', description: 'مراجعة وإكمال جميع المخططات', assigneeId: engineerUser.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-04-01'), dueDate: new Date('2024-05-15'), progress: 70 },
      { projectId: project1.id, title: 'تصميم مخططات الأساسات', description: 'تصميم الأساسات بناءً على تقرير التربة', assigneeId: structuralUser.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-03-15'), dueDate: new Date('2024-05-01'), progress: 50 },
      { projectId: project1.id, title: 'تصميم نظام التكييف المركزي', description: 'إعداد مخططات التكييف', assigneeId: mepUser.id, priority: 'medium', status: 'todo', startDate: new Date('2024-05-01'), dueDate: new Date('2024-06-15'), progress: 0 },
      { projectId: project1.id, title: 'تقديم المستندات للبلدية', description: 'تجهيز وتقديم المستندات', assigneeId: pmUser.id, priority: 'urgent', status: 'todo', startDate: new Date('2024-06-01'), dueDate: new Date('2024-06-15'), progress: 0, isGovernmental: true },
      { projectId: project2.id, title: 'إعداد المخططات الأولية', description: 'المخططات الأولية للمبنى', assigneeId: engineerUser.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-03-15'), dueDate: new Date('2024-06-01'), progress: 60 },
      { projectId: project2.id, title: 'دراسة التربة والأساسات', description: 'دراسة التربة وتصميم الأساسات', assigneeId: structuralUser.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-04-01'), dueDate: new Date('2024-07-01'), progress: 30 },
      { projectId: project2.id, title: 'تصميم الأنظمة الكهربائية', description: 'تصميم الأنظمة الكهربائية', assigneeId: mepUser.id, priority: 'medium', status: 'todo', startDate: new Date('2024-06-01'), dueDate: new Date('2024-09-01'), progress: 0 },
      { projectId: project3.id, title: 'مفهوم التصميم التجاري', description: 'إعداد مفهوم التصميم', assigneeId: engineerUser.id, priority: 'high', status: 'in_progress', startDate: new Date('2024-06-15'), dueDate: new Date('2024-08-15'), progress: 40 },
      { projectId: project5.id, title: 'مراجعة التصميم الإنشائي', description: 'مراجعة وتحديث التصميم', assigneeId: structuralUser.id, priority: 'urgent', status: 'in_progress', startDate: new Date('2024-03-01'), dueDate: new Date('2024-04-01'), progress: 25 },
    ],
  });

  // ========== Invoices ==========
  await db.invoice.createMany({
    data: [
      { number: 'INV-2024-001', clientId: client1.id, projectId: project1.id, issueDate: new Date('2024-02-01'), dueDate: new Date('2024-03-01'), subtotal: 62500, tax: 3750, total: 66250, paidAmount: 66250, remaining: 0, status: 'paid' },
      { number: 'INV-2024-002', clientId: client1.id, projectId: project1.id, issueDate: new Date('2024-05-01'), dueDate: new Date('2024-06-01'), subtotal: 62500, tax: 3750, total: 66250, paidAmount: 33250, remaining: 33000, status: 'partially_paid' },
      { number: 'INV-2024-003', clientId: client2.id, projectId: project2.id, issueDate: new Date('2024-04-01'), dueDate: new Date('2024-05-01'), subtotal: 170000, tax: 10200, total: 180200, paidAmount: 0, remaining: 180200, status: 'overdue' },
      { number: 'INV-2024-004', clientId: client2.id, projectId: project5.id, issueDate: new Date('2024-06-01'), dueDate: new Date('2024-07-01'), subtotal: 100000, tax: 6000, total: 106000, paidAmount: 0, remaining: 106000, status: 'sent' },
      { number: 'INV-2024-005', clientId: client3.id, projectId: project3.id, issueDate: new Date('2024-07-01'), dueDate: new Date('2024-08-01'), subtotal: 150000, tax: 9000, total: 159000, paidAmount: 0, remaining: 159000, status: 'draft' },
      { number: 'INV-2024-006', clientId: client4.id, projectId: project4.id, issueDate: new Date('2024-01-15'), dueDate: new Date('2024-02-15'), subtotal: 180000, tax: 10800, total: 190800, paidAmount: 190800, remaining: 0, status: 'paid' },
    ],
  });

  // ========== Contracts ==========
  await db.contract.createMany({
    data: [
      { number: 'CTR-2024-001', title: 'عقد تصميم فيلا المنطقة الأولى', clientId: client1.id, projectId: project1.id, value: 250000, type: 'engineering_services', status: 'active', signedByName: 'محمد بن راشد', signedByTitle: 'المدير التنفيذي', startDate: new Date('2024-01-15'), endDate: new Date('2024-12-30') },
      { number: 'CTR-2024-002', title: 'عقد تصميم المبنى السكني', clientId: client2.id, projectId: project2.id, value: 850000, type: 'engineering_services', status: 'active', signedByName: 'أحمد الشامسي', signedByTitle: 'رئيس مجلس الإدارة', startDate: new Date('2024-03-01'), endDate: new Date('2025-06-30') },
      { number: 'CTR-2024-003', title: 'عقد الاستشارات الهندسية', clientId: client3.id, projectId: project3.id, value: 1200000, type: 'consulting', status: 'pending_signature', signedByName: 'سعاد الكتبي', signedByTitle: 'مديرة التطوير', startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31') },
    ],
  });

  // ========== Site Visits ==========
  await db.siteVisit.createMany({
    data: [
      { projectId: project1.id, date: new Date('2024-04-15'), plotNumber: 'RKN-LOT-4521', municipality: 'dubai', status: 'approved' },
      { projectId: project2.id, date: new Date('2024-04-20'), plotNumber: 'ADH-LOT-7892', municipality: 'abu_dhabi', status: 'submitted' },
      { projectId: project5.id, date: new Date('2024-03-10'), plotNumber: 'RAK-LOT-3311', municipality: 'ras_al_khaimah', status: 'approved' },
    ],
  });

  // ========== Meetings ==========
  await db.meeting.createMany({
    data: [
      { projectId: project1.id, title: 'اجتماع مراجعة التصميم المعماري', date: new Date('2024-05-20'), time: '10:00', duration: 90, location: 'مكتب بلوبرنت', type: 'onsite' },
      { projectId: project2.id, title: 'اجتماع متابعة المشروع', date: new Date('2024-06-10'), time: '14:00', duration: 60, location: 'Zoom', type: 'online' },
      { title: 'اجتماع الفريق الأسبوعي', date: new Date('2024-06-15'), time: '09:00', duration: 45, location: 'مكتب بلوبرنت', type: 'onsite' },
    ],
  });

  // ========== Suppliers ==========
  await db.supplier.createMany({
    data: [
      { name: 'شركة الخليج للمواد الإنشائية', category: 'materials', email: 'sales@gulf-concrete.ae', phone: '+971-7-222-3344', address: 'رأس الخيمة', rating: 4, creditLimit: 200000 },
      { name: 'الأفق لأنظمة التكييف', category: 'equipment', email: 'info@alofaq-ac.ae', phone: '+971-4-333-4455', address: 'دبي', rating: 5, creditLimit: 350000 },
      { name: 'النور للأنظمة الكهربائية', category: 'materials', email: 'orders@alnoor-electric.ae', phone: '+971-2-444-5566', address: 'أبو ظبي', rating: 4, creditLimit: 150000 },
    ],
  });

  // ========== Site Diaries ==========
  await db.siteDiary.createMany({
    data: [
      { projectId: project1.id, date: new Date('2024-05-10'), weather: 'مشمس 38°C', workerCount: 12, workDescription: 'صب الخرسانة للأساسات' },
      { projectId: project2.id, date: new Date('2024-05-12'), weather: 'غائم 34°C', workerCount: 8, workDescription: 'الحفر وتجهيز موقع الأساسات' },
    ],
  });

  // ========== Government Approvals ==========
  await db.govApproval.createMany({
    data: [
      { projectId: project1.id, authority: 'MUN', status: 'SUBMITTED', submissionDate: new Date('2024-05-01') },
      { projectId: project2.id, authority: 'MUN', status: 'PENDING' },
      { projectId: project1.id, authority: 'FEWA', status: 'PENDING' },
    ],
  });

  // ========== Knowledge Articles ==========
  await db.knowledgeArticle.createMany({
    data: [
      { title: 'دليل إعداد مستندات البلدية', content: 'خطوات إعداد وتقديم المستندات المطلوبة للموافقة البلدية في الإمارات...', category: 'guide', tags: 'بلدية,موافقات', views: 45, authorId: adminUser.id },
      { title: 'معايير تصميم الفلل في دبي', content: 'المتطلبات والمعايير الخاصة بتصميم الفلل...', category: 'guide', tags: 'فلل,تصميم,دبي', views: 32, authorId: engineerUser.id },
      { title: 'أسئلة الدفاع المدني الشائعة', content: 'إجابات على الأسئلة الأكثر شيوعاً حول الدفاع المدني...', category: 'faq', tags: 'دفاع_مدني,سلامة', views: 28, authorId: mepUser.id },
    ],
  });

  // ========== Proposals ==========
  await db.proposal.createMany({
    data: [
      { number: 'PRP-2024-001', clientId: client3.id, projectId: project3.id, subtotal: 1200000, tax: 72000, total: 1272000, status: 'sent' },
    ],
  });

  // ========== Notifications ==========
  await db.notification.createMany({
    data: [
      { userId: adminUser.id, type: 'invoice_overdue', title: 'فاتورة متأخرة', message: 'فاتورة INV-2024-003 تجاوزت تاريخ الاستحقاق - 180,200 درهم', isRead: false, relatedEntityType: 'invoice', createdAt: new Date(Date.now() - 2 * 86400000) },
      { userId: adminUser.id, type: 'approval_needed', title: 'موافقة مطلوبة', message: 'طلب إجازة من سارة علي بانتظار موافقتك', isRead: false, relatedEntityType: 'leave', createdAt: new Date(Date.now() - 86400000) },
      { userId: adminUser.id, type: 'task_deadline', title: 'مهمة متأخرة', message: 'مهمة مراجعة التصميم الإنشائي تجاوزت الموعد النهائي', isRead: false, relatedEntityType: 'task', createdAt: new Date(Date.now() - 6 * 3600000) },
      { userId: adminUser.id, type: 'project_update', title: 'تحديث المشروع', message: 'تم تحديث تقدم مشروع فيلا فاخرة إلى 65%', isRead: true, relatedEntityType: 'project', createdAt: new Date(Date.now() - 5 * 86400000) },
      { userId: adminUser.id, type: 'payment_received', title: 'دفعة مستلمة', message: 'تم استلام دفعة 33,250 درهم من شركة الإعمار', isRead: true, relatedEntityType: 'invoice', createdAt: new Date(Date.now() - 7 * 86400000) },
    ],
  });

  console.log('✅ Base data seeded');

  // ========== Approvals ==========
  const now = new Date();
  await db.approval.createMany({
    data: [
      { entityType: 'invoice', entityId: 'seed-inv-001', title: 'موافقة فاتورة INV-2024-007', description: 'فاتورة خدمات هندسية', status: 'pending', requestedBy: 'أحمد المنصوري', assignedTo: 'سعيد الحوسني', step: 1, totalSteps: 2, amount: 45000, createdAt: new Date(now.getTime() - 2 * 3600000) },
      { entityType: 'purchase_order', entityId: 'seed-po-002', title: 'موافقة أمر شراء PO-2024-003', description: 'مواد بناء', status: 'pending', requestedBy: 'خالد الرميثي', assignedTo: 'سعيد الحوسني', step: 2, totalSteps: 3, amount: 128000, createdAt: new Date(now.getTime() - 5 * 3600000) },
      { entityType: 'leave', entityId: 'seed-leave-003', title: 'موافقة إجازة سنوية', description: 'إجازة 5 أيام', status: 'approved', requestedBy: 'محمد الشامسي', assignedTo: 'أحمد المنصوري', step: 1, totalSteps: 1, amount: 0, notes: 'تمت الموافقة', createdAt: new Date(now.getTime() - 2 * 86400000) },
      { entityType: 'change_order', entityId: 'seed-co-004', title: 'موافقة أمر تغيير CO-2024-001', description: 'تغيير في التصميم المعماري', status: 'rejected', requestedBy: 'فاطمة الكعبي', assignedTo: 'سعيد الحوسني', step: 1, totalSteps: 2, amount: 75000, notes: 'التكلفة مرتفعة', createdAt: new Date(now.getTime() - 4 * 86400000) },
      { entityType: 'payment', entityId: 'seed-pay-005', title: 'موافقة دفعة مقدمة', description: 'دفعة مقدمة 30%', status: 'pending', requestedBy: 'خالد الرميثي', assignedTo: 'أحمد المنصوري', step: 1, totalSteps: 1, amount: 90000, createdAt: new Date(now.getTime() - 12 * 3600000) },
    ],
  });
  console.log('✅ Approvals seeded');

  // ========== Task Comments ==========
  const tasks = await db.task.findMany({ select: { id: true }, take: 10 });
  const users = await db.user.findMany({ select: { id: true }, take: 10 });

  if (tasks.length > 0 && users.length > 0) {
    const existingComments = await db.taskComment.count();
    if (existingComments === 0) {
      const commentData = [
        { taskId: tasks[0].id, userId: users[1].id, content: 'تم مراجعة المخططات الأولية ويحتاج بعض التعديلات على الواجهات', createdAt: new Date(now.getTime() - 3 * 3600000) },
        { taskId: tasks[0].id, userId: users[2].id, content: 'أوافق على التعديلات المطلوبة @أحمد يرجى التحديث', createdAt: new Date(now.getTime() - 2 * 3600000) },
        { taskId: tasks[0].id, userId: users[1].id, content: 'تم تحديث المخططات حسب الملاحظات', createdAt: new Date(now.getTime() - 1 * 3600000) },
        { taskId: tasks[1]?.id, userId: users[2]?.id, content: 'التصميم الإنشائي جاهز للمراجعة @سارة', createdAt: new Date(now.getTime() - 8 * 3600000) },
        { taskId: tasks[1]?.id, userId: users[3]?.id, content: 'تم اعتماد الحسابات من قبل البلدية', createdAt: new Date(now.getTime() - 5 * 3600000) },
        { taskId: tasks[2]?.id, userId: users[1]?.id, content: 'تم تقديم الأوراق إلى البلدية بالأمس', createdAt: new Date(now.getTime() - 24 * 3600000) },
        { taskId: tasks[2]?.id, userId: users[4]?.id, content: 'متى الموعد المتوقع للرد من البلدية؟', createdAt: new Date(now.getTime() - 18 * 3600000) },
        { taskId: tasks[3]?.id, userId: users[2]?.id, content: 'تصميم كهرباء المبنى في المراحل النهائية', createdAt: new Date(now.getTime() - 6 * 3600000) },
      ].filter(c => c.taskId && c.userId);
      await db.taskComment.createMany({ data: commentData });
      console.log(`✅ ${commentData.length} task comments seeded`);
    }
  }

  console.log('\n🎉 BluePrint database seeded successfully!');
  console.log('📧 Admin login: admin@blueprint.ae / admin123');
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (e) => { console.error('❌ Seed error:', e); await db.$disconnect(); process.exit(1); });
