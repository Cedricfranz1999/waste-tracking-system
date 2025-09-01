"use client";
import Link from "next/link";
import {
  CircleUser,
  LayoutDashboard,
  Menu,
  QrCode,
  Trash2,
  FileText,
  TrashIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { DialogTitle } from "~/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "~/auths-store";

const Header = () => {
  const router = useRouter();
  const username = useAuthStore((state) => state?.user?.username);
  const clearUsername = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    clearUsername();
    router.push("/sign-in");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
      className={`sticky top-0 z-40 border-b border-teal-600 bg-teal-800/95 shadow-lg backdrop-blur-md transition-all duration-300`}
    >
      <div className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 border-teal-500 text-white hover:bg-teal-600 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex flex-col bg-gradient-to-b from-teal-800 via-teal-700 to-teal-800"
          >
            <VisuallyHidden>
              <DialogTitle>Navigation Menu</DialogTitle>
            </VisuallyHidden>
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                href="#"
                className="group mb-4 flex items-center gap-2 text-lg font-semibold"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-teal-400 opacity-20 blur-sm transition-opacity group-hover:opacity-30"></div>
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-500 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    <TrashIcon className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-teal-200 to-white bg-clip-text text-xl font-bold text-transparent">
                  Waste Tracker
                </span>
              </Link>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-white transition-all hover:bg-teal-600/80 hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>

              {/* Scanner */}
              <Link
                href="/scanner"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-white transition-all hover:bg-teal-600/80 hover:text-white"
              >
                <QrCode className="h-5 w-5" />
                Scanner
              </Link>

              {/* Garbage */}
              <Link
                href="/garbage"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-white transition-all hover:bg-teal-600/80 hover:text-white"
              >
                <Trash2 className="h-5 w-5" />
                Garbage
              </Link>

              {/* Reports */}
              <Link
                href="/reports"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-white transition-all hover:bg-teal-600/80 hover:text-white"
              >
                <FileText className="h-5 w-5" />
                Reports
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg transition-all hover:from-teal-700 hover:to-teal-800 hover:text-white"
              >
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-lg border border-teal-600 bg-teal-800/95 shadow-lg backdrop-blur-md"
          >
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{username}</p>
                <p className="text-xs leading-none text-teal-200">
                  User
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-teal-600" />
            <DropdownMenuItem
              className="cursor-pointer text-white hover:bg-teal-700 hover:text-white"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};
export default Header;