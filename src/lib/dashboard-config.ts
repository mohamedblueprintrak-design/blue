export interface WidgetConfig {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string; // lucide icon name
  defaultOrder: number;
  isHidden: boolean;
}

export const ALL_WIDGETS: WidgetConfig[] = [
  { id: 'kpi-cards', titleAr: 'المؤشرات الرئيسية', titleEn: 'KPI Cards', icon: 'BarChart3', defaultOrder: 0, isHidden: false },
  { id: 'quick-overview', titleAr: 'نظرة سريعة', titleEn: 'Quick Overview', icon: 'Zap', defaultOrder: 1, isHidden: false },
  { id: 'revenue-chart', titleAr: 'الإيرادات', titleEn: 'Revenue Chart', icon: 'TrendingUp', defaultOrder: 2, isHidden: false },
  { id: 'gantt-timeline', titleAr: 'الجدول الزمني', titleEn: 'Gantt Timeline', icon: 'GanttChart', defaultOrder: 3, isHidden: false },
  { id: 'project-health', titleAr: 'صحة المشاريع', titleEn: 'Project Health', icon: 'HeartPulse', defaultOrder: 4, isHidden: false },
  { id: 'department-progress', titleAr: 'تقدّم الأقسام', titleEn: 'Department Progress', icon: 'Users', defaultOrder: 5, isHidden: false },
  { id: 'recent-projects', titleAr: 'المشاريع الأخيرة', titleEn: 'Recent Projects', icon: 'FolderOpen', defaultOrder: 6, isHidden: false },
  { id: 'team-performance', titleAr: 'أداء الفريق', titleEn: 'Team Performance', icon: 'Award', defaultOrder: 7, isHidden: false },
  { id: 'my-tasks', titleAr: 'مهامي', titleEn: 'My Tasks', icon: 'ClipboardCheck', defaultOrder: 8, isHidden: false },
  { id: 'upcoming-deadlines', titleAr: 'المواعيد النهائية', titleEn: 'Upcoming Deadlines', icon: 'Clock', defaultOrder: 9, isHidden: false },
  { id: 'system-status', titleAr: 'حالة النظام', titleEn: 'System Status', icon: 'Server', defaultOrder: 10, isHidden: false },
  { id: 'activity-feed', titleAr: 'آخر الأنشطة', titleEn: 'Activity Feed', icon: 'Activity', defaultOrder: 11, isHidden: false },
];

export function getDefaultWidgetOrder(): string[] {
  return ALL_WIDGETS.filter(w => !w.isHidden).map(w => w.id).sort((a, b) => {
    const wa = ALL_WIDGETS.find(w => w.id === a)!;
    const wb = ALL_WIDGETS.find(w => w.id === b)!;
    return wa.defaultOrder - wb.defaultOrder;
  });
}

export function getWidgetOrder(): string[] {
  if (typeof window === 'undefined') return getDefaultWidgetOrder();
  try {
    const saved = localStorage.getItem('dashboard-widget-order');
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      // Ensure all saved IDs exist in ALL_WIDGETS and fill in any missing ones
      const allIds = ALL_WIDGETS.map(w => w.id);
      const valid = parsed.filter(id => allIds.includes(id));
      const missing = allIds.filter(id => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultWidgetOrder();
}

export function saveWidgetOrder(order: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dashboard-widget-order', JSON.stringify(order));
}

export function getHiddenWidgets(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('dashboard-hidden-widgets');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveHiddenWidgets(hidden: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dashboard-hidden-widgets', JSON.stringify(hidden));
}

export function toggleWidgetHidden(widgetId: string, currentHidden: string[]): string[] {
  const hidden = [...currentHidden];
  const idx = hidden.indexOf(widgetId);
  if (idx > -1) {
    hidden.splice(idx, 1);
  } else {
    hidden.push(widgetId);
  }
  saveHiddenWidgets(hidden);
  return hidden;
}

export function resetDashboardLayout(): { order: string[]; hidden: string[] } {
  if (typeof window === 'undefined') return { order: getDefaultWidgetOrder(), hidden: [] };
  localStorage.removeItem('dashboard-widget-order');
  localStorage.removeItem('dashboard-hidden-widgets');
  return { order: getDefaultWidgetOrder(), hidden: [] };
}

export function getWidgetConfig(id: string): WidgetConfig | undefined {
  return ALL_WIDGETS.find(w => w.id === id);
}
