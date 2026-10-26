import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  MEMBERSHIPS_GATEWAY,
  MembershipDetail,
  MembershipPlan,
  MembershipSummary,
  MembershipsGateway,
} from './membership.model';
import { MembershipsFacade } from './memberships.facade';

const plan: MembershipPlan = {
  id: '30000000-0000-0000-0000-000000000002',
  name: 'Performance',
  description: 'Unlimited classes and recovery support.',
  tier: 'Premium',
  billingPeriod: 'Quarterly',
  durationDays: 90,
  price: 129,
  currency: 'GBP',
  features: ['Unlimited studio classes', 'Recovery zone and sauna'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const summary: MembershipSummary = {
  id: '40000000-0000-0000-0000-000000000001',
  memberId: '11111111-1111-1111-1111-111111111111',
  planId: plan.id,
  planName: plan.name,
  tier: plan.tier,
  billingPeriod: plan.billingPeriod,
  price: plan.price,
  currency: plan.currency,
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-09-29T00:00:00Z',
  status: 'Active',
  daysRemaining: 42,
  autoRenew: true,
  frozenUntil: null,
};

const detail: MembershipDetail = {
  ...summary,
  durationDays: 90,
  features: plan.features,
  notes: 'Prefers evening classes.',
  frozenFrom: null,
  frozenUntil: null,
  freezeReason: null,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: null,
  rowVersion: '50000000-0000-0000-0000-000000000001',
};

const frozenDetail: MembershipDetail = { ...detail, status: 'Frozen' };
const cancelledDetail: MembershipDetail = { ...detail, status: 'Cancelled' };

function gatewayMock(): MembershipsGateway {
  return {
    listPlans: vi.fn(async () => [plan]),
    planById: vi.fn(async () => plan),
    listMemberships: vi.fn(async () => ({
      items: [summary],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })),
    currentMembership: vi.fn(async () => detail),
    membershipById: vi.fn(async () => detail),
    startMembership: vi.fn(async () => ({ id: detail.id })),
    freezeMembership: vi.fn(async () => frozenDetail),
    resumeMembership: vi.fn(async () => detail),
    cancelMembership: vi.fn(async () => cancelledDetail),
    renewMembership: vi.fn(async () => detail),
    myMemberships: vi.fn(async () => [summary]),
    myCurrent: vi.fn(async () => detail),
    myMembershipById: vi.fn(async () => detail),
    startMyMembership: vi.fn(async () => ({ id: detail.id })),
    freezeMyMembership: vi.fn(async () => frozenDetail),
    resumeMyMembership: vi.fn(async () => detail),
    cancelMyMembership: vi.fn(async () => cancelledDetail),
    renewMyMembership: vi.fn(async () => detail),
  };
}

function setup() {
  const gateway = gatewayMock();
  TestBed.configureTestingModule({
    providers: [MembershipsFacade, { provide: MEMBERSHIPS_GATEWAY, useValue: gateway }],
  });

  return { gateway, facade: TestBed.inject(MembershipsFacade) };
}

describe('MembershipsFacade', () => {
  it('loads the catalogue and current cover together', async () => {
    const { facade, gateway } = setup();

    await facade.loadCatalogue();

    expect(gateway.listPlans).toHaveBeenCalled();
    expect(gateway.myCurrent).toHaveBeenCalled();
    expect(facade.plans()).toEqual([plan]);
    expect(facade.current()?.id).toBe(detail.id);
    expect(facade.currentPlan()?.name).toBe('Performance');
    expect(facade.activePlanCount()).toBe(1);
    expect(facade.plansLoading()).toBe(false);
  });

  it('loads the dashboard history and computed counts', async () => {
    const { facade } = setup();

    await facade.loadOverview();

    expect(facade.current()?.id).toBe(detail.id);
    expect(facade.history()).toEqual([summary]);
    expect(facade.historyCount()).toBe(1);
    expect(facade.overviewLoading()).toBe(false);
  });

  it('starts a subscription and refreshes current cover and history', async () => {
    const { facade, gateway } = setup();
    await facade.loadOverview();

    const id = await facade.start(plan.id);

    expect(id).toBe(detail.id);
    expect(gateway.startMyMembership).toHaveBeenCalledWith({
      planId: plan.id,
      autoRenew: true,
    });
    expect(gateway.myCurrent).toHaveBeenCalledTimes(2);
    expect(facade.actionLoading()).toBe(false);
  });

  it('freezes the selected subscription and updates visible state', async () => {
    const { facade, gateway } = setup();
    await facade.loadDetail(detail.id);

    const frozen = await facade.freeze(detail.id, {
      until: '2026-11-01T00:00:00Z',
      reason: 'Travel',
    });

    expect(frozen?.status).toBe('Frozen');
    expect(gateway.freezeMyMembership).toHaveBeenCalledWith(detail.id, {
      until: '2026-11-01T00:00:00Z',
      reason: 'Travel',
    });
    expect(facade.detail()?.status).toBe('Frozen');
    expect(facade.actionLoading()).toBe(false);
  });

  it('cancels the current subscription and clears active cover', async () => {
    const { facade } = setup();
    await facade.loadOverview();

    const cancelled = await facade.cancel(detail.id);

    expect(cancelled?.status).toBe('Cancelled');
    expect(facade.current()).toBeNull();
    expect(facade.history()[0].status).toBe('Cancelled');
  });

  it('surfaces an unreachable API with the demo port hint', async () => {
    const { facade, gateway } = setup();
    gateway.myCurrent = vi.fn(async () => {
      throw new HttpErrorResponse({ status: 0 });
    });

    await facade.loadOverview();

    expect(facade.error()).toContain('port 5084');
    expect(facade.overviewLoading()).toBe(false);
  });

  it('maps overlapping cover conflicts to an actionable message', async () => {
    const { facade, gateway } = setup();
    gateway.startMyMembership = vi.fn(async () => {
      throw new HttpErrorResponse({ status: 409 });
    });

    const id = await facade.start(plan.id);

    expect(id).toBeNull();
    expect(facade.error()).toContain('already have a membership');
    expect(facade.actionLoading()).toBe(false);
  });
});
