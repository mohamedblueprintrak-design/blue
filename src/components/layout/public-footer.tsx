"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import LogoImage from "@/components/ui/logo-image";

const QUICK_LINKS = [
  { href: "/services", label: "خدماتنا" },
  { href: "/about", label: "من نحن" },
  { href: "/calculator", label: "حاسبة التكاليف" },
  { href: "/quote", label: "طلب عرض سعر" },
  { href: "/dashboard", label: "لوحة التحكم" },
];

const SERVICE_LINKS = [
  "التصميم المعماري",
  "التصميم الإنشائي",
  "التصميم الكهربائي والميكانيكي",
  "رخص البلدية والدفاع المدني",
  "إشراف التنفيذ",
  "الفحص الهندسي",
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
          {/* Company */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <LogoImage size={40} />
              <div>
                <h3 className="text-lg font-bold">BluePrint</h3>
                <p className="text-xs text-slate-400">مكتب الاستشارات الهندسية</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              مكتب هندسي متخصص في رأس الخيمة يقدم خدمات التصميم والترخيص والإشراف الهندسي لأكثر من 15 عاماً
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm mb-4">خدماتنا</h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((s) => (
                <li key={s}>
                  <span className="text-sm text-slate-400">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                رأس الخيمة - الإمارات العربية المتحدة
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <span dir="ltr">+971 7 123 4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                info@blueprint.ae
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} BluePrint Engineering Consultancy. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/97171234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%D9%83%D9%85"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-110"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      </a>
    </footer>
  );
}
