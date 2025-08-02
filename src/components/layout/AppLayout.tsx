import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
import { NextTopLoader } from "./NextTopLoader";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <div className="flex min-h-screen overflow-hidden">
            <NextTopLoader color="hsl(var(--primary))" height={2} showSpinner={false}/>
            <AppSidebar />
            <div className="flex flex-col w-full">
                <Header />
                <main className="flex-1 overflow-y-auto bg-muted/40">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}

    