import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from ".";
import LinkItem from "./link-item";

export function ProBannerSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { showBanner } = data;
  const [enabled, setEnabled] = useState<boolean>(showBanner);

  useEffect(() => {
    setEnabled(showBanner);
  }, [showBanner]);

  const handleShowBanner = () => {
    const updatedShowBanner = !enabled;
    setData({ ...data, showBanner: updatedShowBanner });
    setEnabled(updatedShowBanner);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Show Secured by Hanzo Dataroom"
        tooltipContent="Display 'Secured by Hanzo Dataroom' branding on your shared documents"
        link="https://dataroom.hanzo.ai/help/article/remove-branding"
        enabled={enabled}
        action={handleShowBanner}
      />
    </div>
  );
}
