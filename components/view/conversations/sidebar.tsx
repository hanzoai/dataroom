"use client";

import {
  ConversationSidebarProps,
  ConversationViewSidebar as ConversationViewSidebarEE,
} from "@/features/conversations/components/viewer/conversation-view-sidebar";

export function ConversationSidebar(props: ConversationSidebarProps) {
  return <ConversationViewSidebarEE {...props} />;
}
