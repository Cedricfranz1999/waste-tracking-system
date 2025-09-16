"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  QrCode,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Leaf,
  Trash,
  TrashIcon,
  Barcode,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );

  const isActive = (path: string) => pathname.startsWith(path);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="hidden border-r border-teal-600 bg-gradient-to-b from-teal-800 via-teal-700 to-teal-800 shadow-lg backdrop-blur-sm md:block"
    >
      <div className="flex h-full max-h-screen min-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b border-teal-600 px-4 lg:h-[60px] lg:px-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="group flex items-center space-x-3"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-teal-400 opacity-20 blur-sm transition-opacity group-hover:opacity-30"></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-500 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <TrashIcon className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-teal-200 to-white bg-clip-text text-xl font-bold text-transparent">
              Waste Tracker
            </h1>
          </motion.div>
        </div>
        <div className="mt-6 flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {/* Dashboard */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between">
                <Link
                  href="/cms/dashboard"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/cms/dashboard")
                      ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg"
                      : "text-white hover:bg-teal-600/80 hover:text-white"
                  }`}
                >
                  <Barcode className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between">
                <Link
                  href="/cms/product"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/cms/product")
                      ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg"
                      : "text-white hover:bg-teal-600/80 hover:text-white"
                  }`}
                >
                  <Barcode className="h-4 w-4" />
                  Product
                </Link>
              </div>
            </motion.div>
          </nav>
        </div>
        <div className="mt-auto py-10"></div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
