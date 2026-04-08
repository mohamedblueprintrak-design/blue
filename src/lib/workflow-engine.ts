import { db } from '@/lib/db';

// ==================== TYPES ====================

export interface WorkflowStageData {
  id: string;
  workflowId: string;
  templateStageId: string | null;
  name: string;
  nameEn: string;
  order: number;
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  completedDate: Date | null;
  assigneeId: string | null;
  notes: string;
  steps: WorkflowStepData[];
}

export interface WorkflowStepData {
  id: string;
  stageId: string;
  templateStepId: string | null;
  name: string;
  nameEn: string;
  order: number;
  status: string;
  assigneeId: string | null;
  assignedRole: string;
  startDate: Date | null;
  dueDate: Date | null;
  completedDate: Date | null;
  action: string;
  notes: string;
  returnReason: string;
  severity: string;
}

export interface WorkflowProgress {
  totalStages: number;
  completedStages: number;
  totalSteps: number;
  completedSteps: number;
  progress: number;
  currentStageIndex: number;
}

// ==================== CORE FUNCTIONS ====================

/**
 * Initialize a workflow for a project from a template
 */
export async function initWorkflow(projectId: string, templateId?: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  // Check if workflow already exists
  const existing = await db.projectWorkflow.findUnique({ where: { projectId } });
  if (existing) throw new Error('Workflow already exists for this project');

  // Find template
  let template: any = null;
  if (templateId) {
    template = await db.workflowTemplate.findUnique({
      where: { id: templateId },
      include: {
        stages: { orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' } } } },
      },
    });
  } else {
    template = await db.workflowTemplate.findFirst({
      where: { projectType: project.type, isActive: true },
      include: {
        stages: { orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' } } } },
      },
    });
  }

  if (!template || template.stages.length === 0) {
    throw new Error('No suitable workflow template found');
  }

  // Create the workflow with all stages and steps
  const workflow = await db.projectWorkflow.create({
    data: {
      projectId,
      templateId: template.id,
      status: 'active',
      progress: 0,
      stages: {
        create: template.stages.map((stage, stageIdx) => ({
          templateStageId: stage.id,
          name: stage.name,
          nameEn: stage.nameEn,
          order: stage.order,
          status: stageIdx === 0 ? 'pending' : 'locked',
          startDate: stageIdx === 0 ? new Date() : null,
          dueDate: stageIdx === 0
            ? new Date(Date.now() + stage.durationDays * 24 * 60 * 60 * 1000)
            : null,
          steps: {
            create: stage.steps.map((step, stepIdx) => ({
              templateStepId: step.id,
              name: step.name,
              nameEn: step.nameEn,
              order: step.order,
              assignedRole: step.assignedRole,
              status: stageIdx === 0 && stepIdx === 0 ? 'pending' : 'locked',
              dueDate: stageIdx === 0 && stepIdx === 0 && step.daysToComplete > 0
                ? new Date(Date.now() + step.daysToComplete * 24 * 60 * 60 * 1000)
                : null,
            })),
          },
        })),
      },
    },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: { steps: { orderBy: { order: 'asc' } } },
      },
    },
  });

  // Set the first step as pending
  if (workflow.stages.length > 0 && workflow.stages[0].steps.length > 0) {
    const firstStep = workflow.stages[0].steps[0];
    await db.workflowStep.update({
      where: { id: firstStep.id },
      data: { status: 'pending' },
    });
  }

  // Update project progress
  await updateProjectProgress(workflow.id);

  return workflow;
}

/**
 * Advance workflow to next stage when current completes
 */
export async function advanceWorkflow(workflowId: string) {
  const workflow = await db.projectWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      stages: { orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' } } } },
    },
  });

  if (!workflow) throw new Error('Workflow not found');
  if (workflow.status === 'completed') return workflow;

  const stages = workflow.stages;
  const currentStageIndex = stages.findIndex(
    (s) => s.status === 'in_progress' || s.status === 'pending'
  );

  if (currentStageIndex === -1) {
    // All stages are done
    await db.projectWorkflow.update({
      where: { id: workflowId },
      data: { status: 'completed', completedAt: new Date(), progress: 100 },
    });
    return await db.projectWorkflow.findUnique({ where: { id: workflowId } });
  }

  const currentStage = stages[currentStageIndex];
  const nextStage = stages[currentStageIndex + 1];

  if (!nextStage) {
    // No more stages
    await db.projectWorkflow.update({
      where: { id: workflowId },
      data: { status: 'completed', completedAt: new Date(), progress: 100 },
    });
    return await db.projectWorkflow.findUnique({ where: { id: workflowId } });
  }

  // Complete current stage and activate next
  await db.workflowStage.update({
    where: { id: currentStage.id },
    data: { status: 'completed', completedDate: new Date() },
  });

  await db.workflowStage.update({
    where: { id: nextStage.id },
    data: {
      status: 'in_progress',
      startDate: new Date(),
      dueDate: nextStage.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Unlock first step of next stage
  if (nextStage.steps.length > 0) {
    await db.workflowStep.update({
      where: { id: nextStage.steps[0].id },
      data: { status: 'pending' },
    });
  }

  await db.projectWorkflow.update({
    where: { id: workflowId },
    data: { currentStageId: nextStage.id },
  });

  await updateProjectProgress(workflowId);

  // Send notification
  if (nextStage.steps.length > 0 && nextStage.steps[0].assignedRole) {
    const assignees = await db.user.findMany({
      where: { role: nextStage.steps[0].assignedRole, isActive: true },
    });
    for (const assignee of assignees) {
      await sendNotification(
        assignee.id,
        workflow.projectId,
        'workflow_step_ready',
        `خطوة جديدة في المشروع`,
        `المرحلة "${nextStage.name}" بدأت - الخطوة: "${nextStage.steps[0].name}"`
      );
    }
  }

  return await db.projectWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      stages: { orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' } } } },
    },
  });
}

/**
 * Execute a step action
 */
export async function executeStepAction(
  stepId: string,
  action: 'approve' | 'complete' | 'reject' | 'request_changes' | 'start',
  userId: string,
  data?: { notes?: string; returnReason?: string; severity?: string }
) {
  const step = await db.workflowStep.findUnique({
    where: { id: stepId },
    include: {
      stage: {
        include: {
          workflow: true,
          steps: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!step) throw new Error('Step not found');

  if (action === 'start') {
    await db.workflowStep.update({
      where: { id: stepId },
      data: { status: 'in_progress', startDate: new Date(), assigneeId: userId },
    });
    return step;
  }

  if (action === 'approve' || action === 'complete') {
    await db.workflowStep.update({
      where: { id: stepId },
      data: {
        status: 'completed',
        completedDate: new Date(),
        action,
        notes: data?.notes || '',
      },
    });

    // Check if all steps in the stage are completed
    const stageSteps = step.stage.steps;
    const allCompleted = stageSteps.every(
      (s) => s.status === 'completed' || s.status === 'skipped'
    );

    if (allCompleted) {
      // Complete the stage
      await db.workflowStage.update({
        where: { id: step.stageId },
        data: { status: 'completed', completedDate: new Date() },
      });

      // Advance workflow
      await advanceWorkflow(step.stage.workflowId);
    } else {
      // Unlock next step in the stage
      const nextStepIdx = stageSteps.findIndex((s) => s.id === stepId);
      const nextStep = stageSteps[nextStepIdx + 1];
      if (nextStep && (nextStep.status === 'locked' || nextStep.status === 'pending')) {
        await db.workflowStep.update({
          where: { id: nextStep.id },
          data: { status: 'pending' },
        });
      }
    }

    await updateProjectProgress(step.stage.workflowId);
  }

  if (action === 'reject' || action === 'request_changes') {
    await db.workflowStep.update({
      where: { id: stepId },
      data: {
        status: 'returned',
        action,
        notes: data?.notes || '',
        returnReason: data?.returnReason || '',
        severity: data?.severity || 'normal',
      },
    });

    // Notify previous step's assignee
    const stageSteps = step.stage.steps;
    const stepIdx = stageSteps.findIndex((s) => s.id === stepId);
    if (stepIdx > 0) {
      const prevStep = stageSteps[stepIdx - 1];
      if (prevStep.assigneeId) {
        await sendNotification(
          prevStep.assigneeId,
          step.stage.workflow.projectId,
          'workflow_step_rejected',
          `طلب تعديلات على الخطوة`,
          `الخطوة "${step.name}" تم رفضها - السبب: ${data?.returnReason || 'بدون سبب'}`
        );
      }
    }
  }

  return await db.workflowStep.findUnique({ where: { id: stepId } });
}

/**
 * Assign a step to a user
 */
export async function assignStep(stepId: string, userId: string) {
  const step = await db.workflowStep.findUnique({ where: { id: stepId } });
  if (!step) throw new Error('Step not found');

  return await db.workflowStep.update({
    where: { id: stepId },
    data: { assigneeId: userId, status: 'pending' },
  });
}

/**
 * Calculate workflow progress
 */
export async function getWorkflowProgress(workflowId: string): Promise<WorkflowProgress> {
  const workflow = await db.projectWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      stages: { orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' } } } },
    },
  });

  if (!workflow) {
    return { totalStages: 0, completedStages: 0, totalSteps: 0, completedSteps: 0, progress: 0, currentStageIndex: -1 };
  }

  const stages = workflow.stages;
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const totalSteps = stages.reduce((sum, s) => sum + s.steps.length, 0);
  const completedSteps = stages.reduce(
    (sum, s) => sum + s.steps.filter((st) => st.status === 'completed').length,
    0
  );
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const currentStageIndex = stages.findIndex(
    (s) => s.status === 'in_progress' || s.status === 'pending'
  );

  return { totalStages, completedStages, totalSteps, completedSteps, progress, currentStageIndex };
}

/**
 * Update project workflow progress
 */
async function updateProjectProgress(workflowId: string) {
  const progress = await getWorkflowProgress(workflowId);
  await db.projectWorkflow.update({
    where: { id: workflowId },
    data: { progress: progress.progress },
  });
}

/**
 * Send a notification
 */
async function sendNotification(userId: string, projectId: string, type: string, title: string, message: string) {
  try {
    await db.notification.create({
      data: {
        userId,
        projectId,
        type,
        title,
        message,
        relatedEntityType: 'workflow',
        relatedEntityId: '',
      },
    });
  } catch {
    // Notification creation is best-effort
  }
}

/**
 * Create a workflow template with stages and steps
 */
export async function createWorkflowTemplate(data: {
  name: string;
  nameEn?: string;
  projectType?: string;
  description?: string;
  stages: Array<{
    name: string;
    nameEn?: string;
    order: number;
    durationDays?: number;
    isParallel?: boolean;
    steps: Array<{
      name: string;
      nameEn?: string;
      order: number;
      assignedRole?: string;
      isRequired?: boolean;
      requiresApproval?: boolean;
      autoComplete?: boolean;
      daysToComplete?: number;
    }>;
  }>;
}) {
  return await db.workflowTemplate.create({
    data: {
      name: data.name,
      nameEn: data.nameEn || '',
      projectType: data.projectType || '',
      description: data.description || '',
      stages: {
        create: data.stages.map((stage) => ({
          name: stage.name,
          nameEn: stage.nameEn || '',
          order: stage.order,
          durationDays: stage.durationDays || 0,
          isParallel: stage.isParallel || false,
          steps: {
            create: (stage.steps || []).map((step) => ({
              name: step.name,
              nameEn: step.nameEn || '',
              order: step.order,
              assignedRole: step.assignedRole || '',
              isRequired: step.isRequired !== false,
              requiresApproval: step.requiresApproval || false,
              autoComplete: step.autoComplete || false,
              daysToComplete: step.daysToComplete || 0,
            })),
          },
        })),
      },
    },
    include: { stages: { include: { steps: true } } },
  });
}

/**
 * Seed default workflow templates for each project type
 */
export async function seedDefaultWorkflowTemplates() {
  const templates = [
    {
      name: 'قالب فيلا - رأس الخيمة',
      nameEn: 'Villa Template - RAK',
      projectType: 'villa',
      stages: [
        { name: 'استلام المشروع', nameEn: 'Project Receipt', order: 1, durationDays: 2, steps: [
          { name: 'مراجعة المستندات', nameEn: 'Review Documents', order: 1, assignedRole: 'project_manager', daysToComplete: 1 },
          { name: 'تسجيل المشروع', nameEn: 'Register Project', order: 2, assignedRole: 'secretary', daysToComplete: 1 },
        ]},
        { name: 'التسعير', nameEn: 'Pricing', order: 2, durationDays: 3, steps: [
          { name: 'مراجعة نطاق العمل', nameEn: 'Review Scope', order: 1, assignedRole: 'project_manager', daysToComplete: 1 },
          { name: 'إعداد التسعيرة', nameEn: 'Prepare Pricing', order: 2, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'اعتماد التسعيرة', nameEn: 'Approve Pricing', order: 3, assignedRole: 'admin', requiresApproval: true, daysToComplete: 1 },
        ]},
        { name: 'التصميم المعماري', nameEn: 'Architectural Design', order: 3, durationDays: 14, steps: [
          { name: 'المخططات المبدئية', nameEn: 'Preliminary Plans', order: 1, assignedRole: 'engineer', daysToComplete: 5 },
          { name: 'تطوير التصميم', nameEn: 'Design Development', order: 2, assignedRole: 'engineer', daysToComplete: 5 },
          { name: 'مراجعة التصميم', nameEn: 'Design Review', order: 3, assignedRole: 'project_manager', daysToComplete: 2 },
          { name: 'الموافقة النهائية', nameEn: 'Final Approval', order: 4, assignedRole: 'admin', requiresApproval: true, daysToComplete: 2 },
        ]},
        { name: 'التصميم الإنشائي', nameEn: 'Structural Design', order: 4, durationDays: 10, steps: [
          { name: 'دراسة التربة', nameEn: 'Soil Study', order: 1, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'تصميم الأساسات', nameEn: 'Foundation Design', order: 2, assignedRole: 'engineer', daysToComplete: 4 },
          { name: 'تصميم الهيكل', nameEn: 'Structural Design', order: 3, assignedRole: 'engineer', daysToComplete: 4 },
        ]},
        { name: 'التصميم الكهربائي والميكانيكي', nameEn: 'MEP Design', order: 5, durationDays: 7, steps: [
          { name: 'التصميم الكهربائي', nameEn: 'Electrical Design', order: 1, assignedRole: 'engineer', daysToComplete: 3 },
          { name: 'التصميم الميكانيكي', nameEn: 'Mechanical Design', order: 2, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'تنسيق المخططات', nameEn: 'Drawing Coordination', order: 3, assignedRole: 'project_manager', daysToComplete: 2 },
        ]},
        { name: 'الدفاع المدني', nameEn: 'Civil Defense', order: 6, durationDays: 5, steps: [
          { name: 'مراجعة متطلبات الدفاع المدني', nameEn: 'Review Civil Defense Requirements', order: 1, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'تجهيز المستندات', nameEn: 'Prepare Documents', order: 2, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'تقديم الطلب', nameEn: 'Submit Request', order: 3, assignedRole: 'project_manager', daysToComplete: 1 },
        ]},
        { name: 'البلدية', nameEn: 'Municipality', order: 7, durationDays: 10, steps: [
          { name: 'تجهيز ملف البلدية', nameEn: 'Prepare Municipality File', order: 1, assignedRole: 'engineer', daysToComplete: 3 },
          { name: 'مراجعة داخلية', nameEn: 'Internal Review', order: 2, assignedRole: 'project_manager', daysToComplete: 2 },
          { name: 'تقديم للبلدية', nameEn: 'Submit to Municipality', order: 3, assignedRole: 'secretary', daysToComplete: 1 },
          { name: 'متابعة الطلب', nameEn: 'Follow Up', order: 4, assignedRole: 'project_manager', daysToComplete: 4 },
        ]},
        { name: 'الترخيص', nameEn: 'License', order: 8, durationDays: 5, steps: [
          { name: 'استلام الموافقة', nameEn: 'Receive Approval', order: 1, assignedRole: 'secretary', daysToComplete: 1 },
          { name: 'مراجعة الترخيص', nameEn: 'License Review', order: 2, assignedRole: 'project_manager', daysToComplete: 1 },
          { name: 'إصدار الترخيص', nameEn: 'Issue License', order: 3, assignedRole: 'admin', daysToComplete: 3 },
        ]},
        { name: 'الإشراف', nameEn: 'Supervision', order: 9, durationDays: 30, steps: [
          { name: 'جدول الزيارات', nameEn: 'Visit Schedule', order: 1, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'زيارات الموقع', nameEn: 'Site Visits', order: 2, assignedRole: 'engineer', daysToComplete: 20 },
          { name: 'تقارير الإشراف', nameEn: 'Supervision Reports', order: 3, assignedRole: 'engineer', daysToComplete: 5 },
          { name: 'الموافقة النهائية', nameEn: 'Final Approval', order: 4, assignedRole: 'admin', daysToComplete: 3 },
        ]},
        { name: 'التسليم', nameEn: 'Completion', order: 10, durationDays: 5, steps: [
          { name: 'مراجعة المخرجات', nameEn: 'Review Deliverables', order: 1, assignedRole: 'project_manager', daysToComplete: 2 },
          { name: 'تجهيز المستندات النهائية', nameEn: 'Final Documentation', order: 2, assignedRole: 'engineer', daysToComplete: 2 },
          { name: 'تسليم المشروع', nameEn: 'Project Handover', order: 3, assignedRole: 'admin', daysToComplete: 1 },
        ]},
      ],
    },
  ];

  let count = 0;
  for (const tpl of templates) {
    const existing = await db.workflowTemplate.findFirst({
      where: { projectType: tpl.projectType, name: tpl.name },
    });
    if (!existing) {
      await createWorkflowTemplate(tpl);
      count++;
    }
  }

  return count;
}
