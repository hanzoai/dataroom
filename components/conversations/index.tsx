"use client";

import { ConversationListItem as ConversationListItemEE } from "@/features/conversations/components/dashboard/conversation-list-item";
import { ConversationMessage as ConversationMessageEE } from "@/features/conversations/components/shared/conversation-message";

export function ConversationListItem(props: any) {
  return <ConversationListItemEE {...props} />;
}

export function ConversationMessage(props: any) {
  return <ConversationMessageEE {...props} />;
}
