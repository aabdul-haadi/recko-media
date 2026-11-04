export const INQUIRY_STATUSES = ["new", "in_progress", "responded", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type InquiryPriority = (typeof INQUIRY_PRIORITIES)[number];
export const CONTACT_STATUSES = ["lead", "active", "client", "inactive"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const TASK_STATUSES = ["pending", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const statusLabel: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  responded: "Responded",
  closed: "Closed",
};

export type Inquiry = {
  id: string;
  contact_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  service: string | null;
  source: string;
  page_url: string | null;
  extra: Record<string, unknown>;
  status: InquiryStatus;
  priority: InquiryPriority;
  follow_up_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type InquiryNote = {
  id: string;
  inquiry_id: string;
  body: string;
  created_at: string;
};

export type Contact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: ContactStatus;
  notes: string | null;
  first_contact_at: string;
  last_interaction_at: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: TaskStatus;
  contact_id: string | null;
  inquiry_id: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};
