import { useEffect, useState } from "react";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import LinkItem from "@/components/links/link-sheet/link-item";

export default function AIAgentsSection({
  data,
  setData,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
}) {
  const { enableAIAgents } = data;
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableAIAgents);
  }, [enableAIAgents]);

  const handleToggle = async () => {
    const updatedState = !enabled;

    setData({
      ...data,
      enableAIAgents: updatedState,
    });
    setEnabled(updatedState);
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="AI Agents"
        enabled={enabled}
        action={handleToggle}
        tooltipContent="Allow visitors to chat with AI about this document or dataroom. Requires AI to be enabled at the team and document/dataroom level."
      />
    </div>
  );
}
