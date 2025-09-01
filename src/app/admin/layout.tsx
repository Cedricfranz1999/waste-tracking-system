"use client";
import { Toaster } from "~/components/ui/toaster";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  // useEffect(() => {
  //   const adminData = localStorage.getItem("adminData");
  //   if (!adminData) {
  //     router.push("/adminLogin");
  //   }
  // }, [router]);

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
        
        <div className="flex flex-1 relative">
          {/* Sidebar with higher z-index and fixed positioning */}
          <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
            <Sidebar />
          </div>
          
          {/* Main content with padding to account for sidebar */}
          <main className="flex-1 p-4 md:p-6 md:ml-64 mt-14">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </motion.div>
  );
};

export default AdminLayout;