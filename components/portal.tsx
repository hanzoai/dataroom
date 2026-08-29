import * as React from "react";

import { createPortal } from "react-dom";

const Portal = ({
  containerId,
  children,
}: {
  containerId?: string | null;
  children: React.ReactElement;
  className?: string;
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const container =
    (containerId ? document.getElementById(containerId) : null) ??
    document.body;

  return createPortal(children, container);
};

export { Portal };
