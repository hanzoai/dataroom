import { createPortal } from "react-dom";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Hanzo Dataroom";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dataroom.hanzo.ai";

export const PoweredBy = ({ linkId }: { linkId: string }) => {
  return createPortal(
    <div className="absolute bottom-0 right-0 z-[100] w-fit">
      <div className="p-6">
        <div className="pointer-events-auto relative z-20 flex min-h-8 w-auto items-center justify-end whitespace-nowrap rounded-md bg-black text-white ring-1 ring-white/40 hover:ring-white/90">
          <a
            href={`${APP_URL}?utm_campaign=poweredby&utm_medium=poweredby&utm_source=${linkId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-sm"
            style={{ paddingInlineStart: "12px", paddingInlineEnd: "12px" }}
          >
            Powered by{" "}
            <span className="font-semibold tracking-tighter">{APP_NAME}</span>
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
};
