import { InjectionToken } from '@angular/core';

/** Membership tier granted by a plan. */
export type MembershipTier = 'Basic' | 'Standard' | 'Premium' | 'Elite';

/** Billing cadence captured by a plan and subscription. */
export type BillingPeriod = 'Monthly' | 'Quarterly' | 'Annual';

/** Lifecycle state of a subscription. */
export type MembershipStatus = 'Active' | 'Frozen' | 'Cancelled' | 'Expired';

/** Plan catalogue entry returned by the memberships API. */
export interface MembershipPlan {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: MembershipTier;
  readonly billingPeriod: BillingPeriod;
  readonly durationDays: number;
  readonly price: number;
  readonly currency: string;
  readonly features: string[];
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

/** Compact subscription row used by history and staff lists. */
export interface MembershipSummary {
  readonly id: string;
  readonly memberId: string;
  readonly planId: string;
  readonly planName: string;
  readonly tier: MembershipTier;
  readonly billingPeriod: BillingPeriod;
  readonly price: number;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: MembershipStatus;
  readonly daysRemaining: number;
  readonly autoRenew: boolean;
  readonly frozenUntil: string | null;
}

/** Full subscription projection including plan features and freeze details. */
export interface MembershipDetail extends MembershipSummary {
  readonly durationDays: number;
  readonly features: string[];
  readonly notes: string | null;
  readonly frozenFrom: string | null;
  readonly freezeReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string | null;
  readonly rowVersion: string;
}

/** Identifier returned after starting a membership. */
export interface MembershipCreated {
  readonly id: string;
}

/** Page of API results. */
export interface PagedResult<T> {
  readonly items: T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/** Standard Kinevor response envelope. */
export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string | null;
  readonly errors?: string[] | null;
}

/** Filters accepted by the staff subscription list. */
export interface MembershipListQuery {
  readonly memberId?: string;
  readonly status?: MembershipStatus;
  readonly page?: number;
  readonly pageSize?: number;
}

/** Payload for starting a subscription on behalf of a member. */
export interface StartMembershipRequest {
  readonly memberId: string;
  readonly planId: string;
  readonly startDate?: string | null;
  readonly autoRenew: boolean;
  readonly notes?: string | null;
}

/** Payload for a member starting their own subscription. */
export interface StartMyMembershipRequest {
  readonly planId: string;
  readonly startDate?: string | null;
  readonly autoRenew: boolean;
}

/** Freeze payload. The API accepts an inclusive end date. */
export interface FreezeMembershipRequest {
  readonly until: string;
  readonly reason?: string | null;
}

/** Injection token for the memberships gateway. */
export const MEMBERSHIPS_GATEWAY = new InjectionToken<MembershipsGateway>('MembershipsGateway');

/** Base URL of the memberships API, for example `http://localhost:5084/api/v1`. */
export const MEMBERSHIPS_API_BASE_URL = new InjectionToken<string>('MEMBERSHIPS_API_BASE_URL');

/** HTTP contract consumed by the memberships facades. */
export interface MembershipsGateway {
  /** Lists plans; inactive plans are staff-only. */
  listPlans(includeInactive?: boolean): Promise<MembershipPlan[]>;
  /** Loads one plan. */
  planById(id: string): Promise<MembershipPlan>;
  /** Searches subscriptions as staff. */
  listMemberships(query: MembershipListQuery): Promise<PagedResult<MembershipSummary>>;
  /** Loads a member's current subscription as staff. */
  currentMembership(memberId: string): Promise<MembershipDetail | null>;
  /** Loads one subscription as staff. */
  membershipById(id: string): Promise<MembershipDetail>;
  /** Starts a subscription for a member as staff. */
  startMembership(request: StartMembershipRequest): Promise<MembershipCreated>;
  /** Freezes a subscription as staff. */
  freezeMembership(id: string, request: FreezeMembershipRequest): Promise<MembershipDetail>;
  /** Resumes a subscription as staff. */
  resumeMembership(id: string): Promise<MembershipDetail>;
  /** Cancels a subscription as staff. */
  cancelMembership(id: string): Promise<MembershipDetail>;
  /** Renews a subscription as staff. */
  renewMembership(id: string, periods: number): Promise<MembershipDetail>;
  /** Lists the authenticated member's subscriptions. */
  myMemberships(): Promise<MembershipSummary[]>;
  /** Loads the authenticated member's current subscription. */
  myCurrent(): Promise<MembershipDetail | null>;
  /** Loads one of the authenticated member's subscriptions. */
  myMembershipById(id: string): Promise<MembershipDetail>;
  /** Starts the authenticated member's subscription. */
  startMyMembership(request: StartMyMembershipRequest): Promise<MembershipCreated>;
  /** Freezes the authenticated member's subscription. */
  freezeMyMembership(id: string, request: FreezeMembershipRequest): Promise<MembershipDetail>;
  /** Resumes the authenticated member's subscription. */
  resumeMyMembership(id: string): Promise<MembershipDetail>;
  /** Cancels the authenticated member's subscription. */
  cancelMyMembership(id: string): Promise<MembershipDetail>;
  /** Renews the authenticated member's subscription. */
  renewMyMembership(id: string, periods: number): Promise<MembershipDetail>;
}

/** Status filters offered by the demo and host applications. */
export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = [
  'Active',
  'Frozen',
  'Cancelled',
  'Expired',
];

/** Billing labels shown in the plan catalogue. */
export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  Monthly: 'per month',
  Quarterly: 'per quarter',
  Annual: 'per year',
};

/** Tier ordering used for badges and cards. */
export const TIER_LABELS: Record<MembershipTier, string> = {
  Basic: 'Essential access',
  Standard: 'Everyday training',
  Premium: 'Performance led',
  Elite: 'Concierge club',
};
