import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpMembershipsGateway } from './http-memberships.gateway';
import { MEMBERSHIPS_API_BASE_URL } from './membership.model';

const plan = {
  id: '30000000-0000-0000-0000-000000000001',
  name: 'Foundation',
  description: 'Consistent training with flexible gym access.',
  tier: 'Basic',
  billingPeriod: 'Monthly',
  durationDays: 30,
  price: 39,
  currency: 'GBP',
  features: ['Unrestricted gym floor access'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const summary = {
  id: '40000000-0000-0000-0000-000000000001',
  memberId: '11111111-1111-1111-1111-111111111111',
  planId: plan.id,
  planName: plan.name,
  tier: 'Basic',
  billingPeriod: 'Monthly',
  price: 39,
  currency: 'GBP',
  startDate: '2026-09-01T00:00:00Z',
  endDate: '2026-10-01T00:00:00Z',
  status: 'Active',
  daysRemaining: 12,
  autoRenew: true,
  frozenUntil: null,
};

const detail = {
  ...summary,
  durationDays: 30,
  features: plan.features,
  notes: null,
  frozenFrom: null,
  frozenUntil: null,
  freezeReason: null,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: null,
  rowVersion: '50000000-0000-0000-0000-000000000001',
};

describe('HttpMembershipsGateway', () => {
  let gateway: HttpMembershipsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpMembershipsGateway,
        { provide: MEMBERSHIPS_API_BASE_URL, useValue: 'http://api.test/api/v1/' },
      ],
    });
    gateway = TestBed.inject(HttpMembershipsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists active plans without the staff filter', async () => {
    const promise = gateway.listPlans();

    const request = http.expectOne((req) => req.url === 'http://api.test/api/v1/plans');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('includeInactive')).toBe('false');
    request.flush({ success: true, data: [plan] });

    expect((await promise)[0].name).toBe('Foundation');
  });

  it('requests staff-filtered plans and subscription pages', async () => {
    const plansPromise = gateway.listPlans(true);
    const plansRequest = http.expectOne((req) => req.url === 'http://api.test/api/v1/plans');
    expect(plansRequest.request.params.get('includeInactive')).toBe('true');
    plansRequest.flush({ success: true, data: [plan] });
    await plansPromise;

    const listPromise = gateway.listMemberships({
      memberId: summary.memberId,
      status: 'Active',
      page: 2,
      pageSize: 10,
    });
    const listRequest = http.expectOne(
      (req) => req.url === 'http://api.test/api/v1/memberships',
    );
    expect(listRequest.request.params.get('memberId')).toBe(summary.memberId);
    expect(listRequest.request.params.get('status')).toBe('Active');
    expect(listRequest.request.params.get('page')).toBe('2');
    expect(listRequest.request.params.get('pageSize')).toBe('10');
    listRequest.flush({
      success: true,
      data: {
        items: [summary],
        totalCount: 1,
        page: 2,
        pageSize: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: true,
      },
    });

    const page = await listPromise;
    expect(page.totalCount).toBe(1);
    expect(page.items[0].planName).toBe('Foundation');
  });

  it('loads the self-service current subscription', async () => {
    const promise = gateway.myCurrent();

    const request = http.expectOne('http://api.test/api/v1/me/memberships/current');
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: detail });

    expect((await promise)?.id).toBe(detail.id);
  });

  it('posts a self-service start request', async () => {
    const promise = gateway.startMyMembership({ planId: plan.id, autoRenew: true });

    const request = http.expectOne('http://api.test/api/v1/me/memberships');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.planId).toBe(plan.id);
    expect(request.request.body.autoRenew).toBe(true);
    request.flush({ success: true, data: { id: detail.id } });

    expect((await promise).id).toBe(detail.id);
  });

  it('posts an inclusive freeze window', async () => {
    const promise = gateway.freezeMyMembership(summary.id, {
      until: '2026-11-01T00:00:00Z',
      reason: 'Travel',
    });

    const request = http.expectOne(
      `http://api.test/api/v1/me/memberships/${summary.id}/freeze`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.reason).toBe('Travel');
    request.flush({ success: true, data: { ...detail, status: 'Frozen' } });

    expect((await promise).status).toBe('Frozen');
  });

  it('renews by whole periods', async () => {
    const promise = gateway.renewMyMembership(summary.id, 3);

    const request = http.expectOne(
      `http://api.test/api/v1/me/memberships/${summary.id}/renew`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.periods).toBe(3);
    request.flush({ success: true, data: detail });

    await promise;
  });
});
