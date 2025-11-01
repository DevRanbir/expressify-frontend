"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Lottie from "lottie-react";
import animationData from "../../public/404 Error.json";

export default function NotFound() {
  return (
    <SidebarProvider>
      <ExpressifySidebar />
      <SidebarInset>
        {/* Top Bar with breadcrumb */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Page Not Found</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Center Content with Lottie Animation */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <Lottie 
              animationData={animationData} 
              loop={true}
              autoplay={true}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
