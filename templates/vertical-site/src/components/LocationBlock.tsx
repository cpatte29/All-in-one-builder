import type { SiteConfig } from "@/config/types";
import ClickToCall from "./ClickToCall";

export default function LocationBlock({ config }: { config: SiteConfig }) {
  return (
    <div className="rounded-lg border border-gray-200 p-5 text-sm">
      <div className="font-semibold">{config.businessName}</div>
      <div className="mt-1 text-gray-600">{config.address}</div>
      <div className="mt-1 text-gray-600">{config.hours}</div>
      <div className="mt-2">
        <ClickToCall phone={config.phone} />
      </div>
    </div>
  );
}
