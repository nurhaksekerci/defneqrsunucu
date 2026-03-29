import type { EventCategoryId } from '@/lib/constants/eventCategories';
import type { DistrictId } from '@/lib/constants/districts';

export type BranchKind = 'ana_kademe' | 'genclik' | 'kadin' | 'komisyon';

export type FeedPost = {
  id: string;
  orgPath: string;
  orgUnitId?: string;
  branch: BranchKind;
  branchLabel: string;
  authorLabel: string;
  eventTitle?: string;
  eventDescription?: string;
  eventLocation?: string;
  eventStartAt?: string | null;
  caption: string;
  imageUrls: string[];
  postImages?: { id: string; url: string }[];
  likes: number;
  liked?: boolean;
  isMine?: boolean;
  canManage?: boolean;
  timeLabel: string;
  districtId: DistrictId;
  eventCategoryId: EventCategoryId;
};

export type PlannedEvent = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  orgPath: string;
  orgUnitId?: string;
  branch: BranchKind;
  branchLabel: string;
  commissionId?: number | null;
  startLabel: string;
  startAt?: string;
  eventCategoryId?: string;
  isMine?: boolean;
  location: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  unread: boolean;
};

export type OrgMembershipInfo = {
  orgUnitId: string;
  label: string;
  role: string;
  roleLabel: string;
  title: string;
  isPrimary: boolean;
};

export type CurrentUser = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  isStaff: boolean;
  memberships: OrgMembershipInfo[];
  primaryBranch?: string | null;
  primaryCommissionId?: number | null;
};
