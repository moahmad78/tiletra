"use client";

import ConnectDashboard from "@/components/connect/ConnectDashboard";

export default function AdminHelpPage() {
  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-64px)] bg-[#071321]">
      <ConnectDashboard portalContext="admin" currentAgentEmail="admin@intrihub.com" />
    </div>
  );
}
