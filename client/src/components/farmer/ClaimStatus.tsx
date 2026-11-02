import { statusDetails, type ClaimStatus as Status } from "@/types/claim";
export default function ClaimStatus({ status }: { status: Status }) {
  const detail = statusDetails[status];
  return <span className={`kc-status kc-status-${detail.tone}`}><span />{detail.label}</span>;
}
