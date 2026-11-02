import type { ReactNode } from "react";
import SessionProvider from "@/components/auth/SessionProvider";
import PortalShell from "@/components/farmer/PortalShell";
export default function OfficerLayout({ children }: { children: ReactNode }) {
  return <SessionProvider role="officer"><PortalShell>{children}</PortalShell></SessionProvider>;
}
