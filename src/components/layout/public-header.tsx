"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoImage from "@/components/ui/logo-image";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/services", label: "خدماتنا" },
  { href: "/about", label: "من نحن" },
  { href: "/calculator", label: "حاسبة التكاليف" },
  { href: "/quote", label: "طلب عرض سعر" },
];

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <LogoImage size={40} />
            <div>
              <h1 className="text-lg font-bold text-slate-900">BluePrint</h1>
              <p className="text-[10px] text-teal-600 font-medium">مكتب الاستشارات الهندسية</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/dashboard" className="mr-2">
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20">
                <Calculator className="w-4 h-4 me-1.5" />
                لوحة التحكم
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-teal-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                  <Calculator className="w-4 h-4 me-1.5" />
                  لوحة التحكم
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
