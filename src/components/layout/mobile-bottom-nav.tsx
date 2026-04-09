"use client";

import { useState } from "react";
import {
  LayoutDashboard, FolderKanban, List,
  Sparkles, Settings,
  CreditCard, FileText, Users, Shield,
  BarChart2, MapPin, Send, BookOpen,
  Calendar, BellRing, Activity, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/store/nav-store";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BottomNavItem {
  pageId: string;
  icon: typeof LayoutDashboard;
  labelAr: string;
  labelEn: string;
}

interface MoreMenuItem {
  pageId: string;
  icon: typeof LayoutDashboard;
  labelAr: string;
  labelEn: string;
}

const bottomNavItems: BottomNavItem[] = [
  { pageId: "dashboard", icon: LayoutDashboard, labelAr: "الرئيسية", labelEn: "Home" },
  { pageId: "projects", icon: FolderKanban, labelAr: "المشاريع", labelEn: "Projects" },
  { pageId: "tasks", icon: List, labelAr: "المهام", labelEn: "Tasks" },
  { pageId: "ai-assistant", icon: Sparkles, labelAr: "المساعد الذكي", labelEn: "AI" },
  { pageId: "settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings" },
];

const moreMenuItems: MoreMenuItem[] = [
  { pageId: "clients", icon: Users, labelAr: "العملاء", labelEn: "Clients" },
  { pageId: "contracts", icon: FileText, labelAr: "العقود", labelEn: "Contracts" },
  { pageId: "documents", icon: FileText, labelAr: "المستندات", labelEn: "Documents" },
  { pageId: "financial-invoices", icon: CreditCard, labelAr: "الفواتير", labelEn: "Invoices" },
  { pageId: "site-visits", icon: MapPin, labelAr: "زيارات الموقع", labelEn: "Site Visits" },
  { pageId: "meetings", icon: Calendar, labelAr: "الاجتماعات", labelEn: "Meetings" },
  { pageId: "transmittals", icon: Send, labelAr: "الإحالات", labelEn: "Transmittals" },
  { pageId: "risks", icon: Shield, labelAr: "المخاطر", labelEn: "Risks" },
  { pageId: "reports", icon: BarChart2, labelAr: "التقارير", labelEn: "Reports" },
  { pageId: "notifications", icon: BellRing, labelAr: "الإشعارات", labelEn: "Notifications" },
  { pageId: "activity-log", icon: Activity, labelAr: "سجل النشاط", labelEn: "Activity Log" },
  { pageId: "calendar", icon: Calendar, labelAr: "التقويم", labelEn: "Calendar" },
  { pageId: "knowledge", icon: BookOpen, labelAr: "قاعدة المعرفة", labelEn: "Knowledge" },
  { pageId: "search", icon: Search, labelAr: "البحث", labelEn: "Search" },
  { pageId: "help", icon: BookOpen, labelAr: "المساعدة", labelEn: "Help" },
];

export default function MobileBottomNav({ language }: { language: "ar" | "en" }) {
  const isAr = language === "ar";
  const { currentPage, setCurrentPage } = useNavStore();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMoreSheetOpen(false);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 border-t z-40 md:hidden",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-700",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex items-center justify-around py-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || currentPage.startsWith(item.id + "-");

            return (
              <button
                key={item.pageId}
                onClick={() => handleNavClick(item.pageId)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative min-w-[56px]",
                  isActive
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive && "font-semibold"
                )}>
                  {isAr ? item.labelAr : item.labelEn}
                </span>
                {isActive && (
                  <div className={cn(
                    "absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full",
                    "bg-teal-500"
                  )} />
                )}
              </button>
            );
          })}

          {/* More button - opens Sheet */}
          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative min-w-[56px]",
                  "text-slate-400 dark:text-slate-500"
                )}
              >
                <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-5 h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {isAr ? "المزيد" : "More"}
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side={isAr ? "right" : "left"}
              className="w-72 p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            >
              <SheetTitle className="sr-only">
                {isAr ? "المزيد من الخيارات" : "More Options"}
              </SheetTitle>
              <div className="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "المزيد" : "More"}
                </h3>
              </div>
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <div className="p-2 space-y-1">
                  {moreMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.pageId;

                    return (
                      <button
                        key={item.pageId}
                        onClick={() => handleNavClick(item.pageId)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">
                          {isAr ? item.labelAr : item.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
