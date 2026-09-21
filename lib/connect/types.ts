export type ConnectChannel = "WHATSAPP" | "EMAIL";
export type ConversationStatus = "OPEN" | "PENDING" | "WAITING_CUSTOMER" | "RESOLVED";
export type PriorityLevel = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
export type AiTone = "Professional" | "Friendly" | "Short" | "Detailed" | "Hinglish" | "Custom";

export interface ConnectCustomerData {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  tags: string[];
  notes?: string | null;
  totalOrders: number;
  totalSpend: number;
  createdAt: string;
}

export interface ConnectMessageData {
  id: string;
  conversationId: string;
  channel: ConnectChannel;
  sender: string;
  recipient?: string | null;
  direction: MessageDirection;
  body: string;
  originalBody?: string | null;
  translatedBody?: string | null;
  detectedLanguage?: string | null;
  sentiment?: "Positive" | "Neutral" | "Negative" | null;
  messageType: "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO";
  attachments?: Array<{ url: string; name: string; size: string; type: string }>;
  status: MessageStatus;
  externalMessageId?: string | null;
  createdAt: string;
}

export interface ConnectConversationData {
  id: string;
  customerId: string;
  channel: ConnectChannel;
  accountEmail?: string | null;
  subject?: string | null;
  status: ConversationStatus;
  priority: PriorityLevel;
  assignedTo?: string | null;
  isStarred: boolean;
  lastMessageAt: string;
  createdAt: string;
  customer?: ConnectCustomerData;
  messages?: ConnectMessageData[];
  unreadCount?: number;
  openTicketsCount?: number;
  lastMessagePreview?: string;
}

export interface ConnectTicketData {
  id: string;
  ticketNumber: string;
  conversationId?: string | null;
  customerId: string;
  customerName?: string;
  subject: string;
  description?: string | null;
  priority: PriorityLevel;
  category: string;
  status: TicketStatus;
  assignedAgent?: string | null;
  slaFirstResponseMinutes: number;
  slaResolutionHours: number;
  dueAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectSourceCitation {
  sourceTitle: string;
  category: "Policy" | "Product" | "FAQ" | "SOP" | "Live Order";
  version?: string;
  referenceId?: string;
  snippet?: string;
}

export interface ConnectAiSuggestionResult {
  detectedLanguage: string;
  intent: string;
  confidence: number; // 0-100
  isConfident: boolean;
  suggestedReply: string;
  recommendedAction?: string;
  sources: ConnectSourceCitation[];
  recommendedTemplateId?: string;
  policyPassed: boolean;
  guardrailNotes?: string;
  summary?: {
    customerWants: string;
    issue: string;
    currentStatus: string;
    nextAction: string;
  };
}

export interface ConnectTemplateData {
  id: string;
  name: string;
  category: string;
  channel: "WHATSAPP" | "EMAIL" | "ALL";
  subject?: string | null;
  htmlContent?: string | null;
  textContent: string;
  variables: string[];
  language: string;
  status: "DRAFT" | "APPROVED";
  createdBy?: string | null;
  updatedAt: string;
}

export interface ConnectKnowledgeItem {
  id: string;
  title: string;
  category: "POLICIES" | "FAQS" | "PRODUCTS" | "SERVICES" | "SOP";
  version: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  approvedBy?: string | null;
  approvedAt?: string | null;
  content: string;
  updatedAt: string;
}
