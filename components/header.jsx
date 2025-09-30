"use client";

import React from "react";
import { AuthenticateWithRedirectCallback, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { BarLoader } from "react-spinners";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {Authenticated, Unautenticated, Unauthenticated} from 'convex/react'
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";

const Header = () => {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur-z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Link */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="Split logo"
            width={200}
            height={60}
            className="h-11 w-auto object-contain"
          />
        </Link>

        {/* Nav Links (only on homepage) */}
        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              Features
            </Link>
            <Link
              href="#How-it-Works"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              How it Works
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Authenticated>
            <Link href="/dashboard">
            <Button variant="outline"
            className="hidden md:inline-flex items-center gap-2 hover:text-green-600
            hover:border-green-600 transition">
              
            <LayoutDashboard className="h-4 w-4"/>
            Dashboard </Button>
            <Button variant="outline" className="md:hidden w-10 h-10 p-0 hover:border-green-600 transition">
              <LayoutDashboard className="h-4 w-4"/>
            </Button>
            </Link>
            <UserButton />
          </Authenticated>
              <Unauthenticated>
                <SignInButton>
                  <Button variant={"ghost"}>Sign In</Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="bg-green-600 hover:bg-green-700 border-none"> Get Started</Button>
                </SignUpButton>
              </Unauthenticated>

        </div>
         {isLoading && (
  <div className="absolute bottom-0 left-0 w-full">
    <BarLoader width={"100%"} color="#36d7b7" />
  </div>
)}
      </nav>
    </header>
  );
};

export default Header;
