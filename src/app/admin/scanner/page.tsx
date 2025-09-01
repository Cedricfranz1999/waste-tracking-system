"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Page = () => {
  const router = useRouter();

  // generate random string (URL-safe)
  const generateRandomId = (length: number) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    const randomId = generateRandomId(100);
    router.push(`/admin/scanner/${randomId}`);
  }, [router]);

  return <div>Redirecting...</div>;
};

export default Page;
