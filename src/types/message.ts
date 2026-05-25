/** 대화 목록 아이템 (conversation + designer 정보 조인) */
export type ConversationItem = {
  id: string;
  designerId: string;
  designerName: string;
  designerProfileImage: string | null;
  designerRole: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

/** 개별 메시지 */
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image";
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};
