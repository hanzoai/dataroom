import { Dispatch, SetStateAction, useId } from "react";

import { LayoutGroup, motion } from "motion/react";

import { classNames } from "@/lib/utils";

export function TabSelect<T extends string>({
  options,
  selected,
  onSelect,
  className,
}: {
  options: { id: T; label: string }[];
  selected: string | null;
  onSelect?: Dispatch<SetStateAction<T>> | ((id: T) => void);
  className?: string;
}) {
  const layoutGroupId = useId();

  return (
    <div
      className={classNames("flex text-sm", className ?? "")}
      style={{ display: "flex", fontSize: "0.875rem" }}
    >
      <LayoutGroup id={layoutGroupId}>
        {options.map(({ id, label }) => (
          <div key={id} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => onSelect?.(id)}
              style={{
                padding: "1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color:
                  id === selected
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
              }}
              aria-selected={id === selected}
            >
              {label}
            </button>
            {id === selected && (
              <motion.div
                layoutId="indicator"
                transition={{
                  duration: 0.1,
                }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  padding: "0 0.375rem",
                }}
              >
                <div
                  style={{
                    height: 2,
                    background: "var(--foreground)",
                  }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </LayoutGroup>
    </div>
  );
}
