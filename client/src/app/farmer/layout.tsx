import type { ReactNode } from "react";
import SessionProvider from "@/components/auth/SessionProvider";
import PortalShell from "@/components/farmer/PortalShell";
export default function FarmerLayout({ children }: { children: ReactNode }) {
  return <SessionProvider role="farmer"><PortalShell>{children}</PortalShell></SessionProvider>;
}
