export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type MemberRole = 'Chair' | 'Vice Chair' | 'Secretary' | 'Treasurer' | 'Member';
export type AgendaItemStatus = 'pending' | 'discussed' | 'approved' | 'deferred';

export interface BoardMember {
  id: string;
  name: string;
  role: MemberRole;
  email: string;
  phone: string;
  joinDate: string;
  avatar: string;
  designation: string;
}

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  presenter: string;
  duration: number;
  status: AgendaItemStatus;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: MeetingStatus;
  attendees: string[];
  agenda: AgendaItem[];
  minutes?: string;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle: string;
  description: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export type DocumentType = 'policy' | 'bylaw' | 'memo' | 'contract' | 'report' | 'other';

export interface Document {
  id: string;
  title: string;
  fileName: string;
  type: DocumentType;
  category: string;
  size: number;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  archived: boolean;
}

export interface ApprovalRecord {
  memberId: string;
  status: 'pending' | 'approved' | 'rejected';
  date?: string;
}

export interface ApprovalWorkflow {
  id: string;
  title: string;
  description: string;
  initiator: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approvers: string[];
  approvals: ApprovalRecord[];
  createdAt: string;
  dueDate: string;
}

export interface Ballot {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed';
  options: string[];
  votes: Record<string, string>;
  createdAt: string;
  closesAt: string;
}

export interface Resolution {
  id: string;
  number: string;
  title: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
}

export interface Policy {
  id: string;
  title: string;
  version: string;
  category: string;
  status: 'active' | 'archived' | 'draft';
  lastReviewed: string;
}

export interface Report {
  id: string;
  title: string;
  period: string;
  summary: string;
}
