"use client";
import { Toaster } from "~/components/ui/toaster";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuthStore } from "~/auths-store";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const role = useAuthStore((state) => state?.user?.type);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/cms-login");
    }
  }, [mounted, role, router]);

  if (!mounted) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-[#caedd5] to-white"
    >
      <div className="flex min-h-screen w-full flex-col bg-teal-50">
        {/* Header with lower z-index */}
        <div className="z-30">
          <Header />
        </div>

        <div className="relative flex flex-1">
          {/* Sidebar with higher z-index and fixed positioning */}
          <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
            <Sidebar />
          </div>

          {/* Main content with padding to account for sidebar */}
          <main className="mt-14 flex-1 p-4 md:ml-64 md:p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </motion.div>
  );
};

export default AdminLayout;
