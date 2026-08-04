import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export default function ScreenshotProtectionSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableScreenshotProtection } = data;
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(enableScreenshotProtection);
  }, [enableScreenshotProtection]);

  const handleEnableScreenshotProtection = () => {
    const updatedEnableScreenshotProtection = !enabled;
    setData({
      ...data,
      enableScreenshotProtection: updatedEnableScreenshotProtection,
    });
    setEnabled(updatedEnableScreenshotProtection);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Enable screenshot protection"
        tooltipContent="Prevent users from taking screenshots of your content."
        link="https://dataroom.hanzo.ai/screenshot-protection"
        enabled={enabled}
        action={handleEnableScreenshotProtection}
      />
    </div>
  );
}
