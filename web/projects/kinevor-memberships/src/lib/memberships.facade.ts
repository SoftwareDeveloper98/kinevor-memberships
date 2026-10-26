import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FreezeMembershipRequest, MEMBERSHIPS_GATEWAY, MembershipDetail, MembershipPlan, MembershipSummary } from './membership.model';

/** Catalogue, current subscription, history and lifecycle state. */
@Injectable()
export class MembershipsFacade {
  private readonly gateway = inject(MEMBERSHIPS_GATEWAY);

  private readonly plansState = signal<MembershipPlan[]>([]);
  private readonly plansLoadingState = signal(false);
  private readonly currentState = signal<MembershipDetail | null>(null);
  private readonly historyState = signal<MembershipSummary[]>([]);
  private readonly overviewLoadingState = signal(false);
  private readonly detailState = signal<MembershipDetail | null>(null);
  private readonly detailLoadingState = signal(false);
  private readonly actionState = signal(false);
  private readonly errorState = signal<string | null>(null);

  /** Active plans shown in the catalogue. */
  readonly plans = this.plansState.asReadonly();
  /** Whether the catalogue is loading. */
  readonly plansLoading = this.plansLoadingState.asReadonly();
  /** Authenticated member's current subscription. */
  readonly current = this.currentState.asReadonly();
  /** Every subscription owned by the authenticated member. */
  readonly history = this.historyState.asReadonly();
  /** Whether the overview is loading. */
  readonly overviewLoading = this.overviewLoadingState.asReadonly();
  /** Subscription selected on the detail page. */
  readonly detail = this.detailState.asReadonly();
  /** Whether the detail page is loading. */
  readonly detailLoading = this.detailLoadingState.asReadonly();
  /** Whether a start, freeze, resume, renew or cancel action is in flight. */
  readonly actionLoading = this.actionState.asReadonly();
  /** Last failure message. */
  readonly error = this.errorState.asReadonly();

  /** Plan behind the current subscription, when the catalogue is loaded. */
  readonly currentPlan = computed(() => {
    const current = this.currentState();
    if (!current) return null;
    return this.plansState().find((plan) => plan.id === current.planId) ?? null;
  });
  /** Number of entries in the subscription history. */
  readonly historyCount = computed(() => this.historyState().length);
  /** Number of active plans in the catalogue. */
  readonly activePlanCount = computed(
    () => this.plansState().filter((plan) => plan.isActive).length,
  );
  /** Lowest monthly-equivalent price across active plans. */
  readonly startingPrice = computed(() => {
    const plans = this.plansState().filter((plan) => plan.isActive);
    if (plans.length === 0) return null;
    return plans.reduce((lowest, plan) => Math.min(lowest, plan.price), Number.POSITIVE_INFINITY);
  });
  /** Cancelled, expired and past subscriptions only. */
  readonly pastMemberships = computed(() =>
    this.historyState().filter(
      (membership) =>
        membership.id !== this.currentState()?.id ||
        membership.status === 'Cancelled' ||
        membership.status === 'Expired',
    ),
  );

  /** Loads the plan catalogue and the current subscription together. */
  async loadCatalogue(): Promise<void> {
    this.plansLoadingState.set(true);
    this.errorState.set(null);

    try {
      const [plans, current] = await Promise.all([
        this.gateway.listPlans(),
        this.gateway.myCurrent(),
      ]);
      this.plansState.set(plans);
      this.currentState.set(current);
    } catch (error) {
      this.errorState.set(this.messageFor(error));
    } finally {
      this.plansLoadingState.set(false);
    }
  }

  /** Loads the current subscription and full self-service history. */
  async loadOverview(): Promise<void> {
    this.overviewLoadingState.set(true);
    this.errorState.set(null);

    try {
      const [current, history] = await Promise.all([
        this.gateway.myCurrent(),
        this.gateway.myMemberships(),
      ]);
      this.currentState.set(current);
      this.historyState.set(history);
    } catch (error) {
      this.errorState.set(this.messageFor(error));
    } finally {
      this.overviewLoadingState.set(false);
    }
  }

  /**
   * Loads one of the authenticated member's subscriptions.
   *
   * @param id - Subscription identifier.
   * @returns Loaded detail, or null on failure.
   */
  async loadDetail(id: string): Promise<MembershipDetail | null> {
    this.detailLoadingState.set(true);
    this.errorState.set(null);

    try {
      const detail = await this.gateway.myMembershipById(id);
      this.detailState.set(detail);
      return detail;
    } catch (error) {
      this.detailState.set(null);
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  /**
   * Starts a subscription on the current plan.
   *
   * @param planId - Plan to subscribe to.
   * @param autoRenew - Whether the subscription should renew automatically.
   * @returns Created identifier, or null when the request failed.
   */
  async start(planId: string, autoRenew = true): Promise<string | null> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      const created = await this.gateway.startMyMembership({ planId, autoRenew });
      await this.refreshCurrentAndHistory();
      return created.id;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.actionState.set(false);
    }
  }

  /**
   * Freezes a subscription and refreshes visible state.
   *
   * @param id - Subscription identifier.
   * @param request - Inclusive freeze end date and optional reason.
   * @returns Updated detail, or null on failure.
   */
  async freeze(id: string, request: FreezeMembershipRequest): Promise<MembershipDetail | null> {
    return this.mutate(id, () => this.gateway.freezeMyMembership(id, request));
  }

  /**
   * Resumes a frozen subscription.
   *
   * @param id - Subscription identifier.
   * @returns Updated detail, or null on failure.
   */
  async resume(id: string): Promise<MembershipDetail | null> {
    return this.mutate(id, () => this.gateway.resumeMyMembership(id));
  }

  /**
   * Renews a subscription by whole billing periods.
   *
   * @param id - Subscription identifier.
   * @param periods - Number of periods between one and twelve.
   * @returns Updated detail, or null on failure.
   */
  async renew(id: string, periods = 1): Promise<MembershipDetail | null> {
    return this.mutate(id, () => this.gateway.renewMyMembership(id, periods));
  }

  /**
   * Cancels a subscription permanently.
   *
   * @param id - Subscription identifier.
   * @returns Updated detail, or null on failure.
   */
  async cancel(id: string): Promise<MembershipDetail | null> {
    return this.mutate(id, () => this.gateway.cancelMyMembership(id));
  }

  /** Clears the selected subscription and any failure message. */
  clearDetail(): void {
    this.detailState.set(null);
    this.errorState.set(null);
  }

  private async mutate(
    id: string,
    action: () => Promise<MembershipDetail>,
  ): Promise<MembershipDetail | null> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      const detail = await action();
      this.detailState.set(detail.id === id ? detail : this.detailState());
      this.applySummary(detail);
      return detail;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.actionState.set(false);
    }
  }

  private async refreshCurrentAndHistory(): Promise<void> {
    const [current, history] = await Promise.all([
      this.gateway.myCurrent(),
      this.gateway.myMemberships(),
    ]);
    this.currentState.set(current);
    this.historyState.set(history);
  }

  private applySummary(detail: MembershipDetail): void {
    const summary: MembershipSummary = {
      id: detail.id,
      memberId: detail.memberId,
      planId: detail.planId,
      planName: detail.planName,
      tier: detail.tier,
      billingPeriod: detail.billingPeriod,
      price: detail.price,
      currency: detail.currency,
      startDate: detail.startDate,
      endDate: detail.endDate,
      status: detail.status,
      daysRemaining: detail.daysRemaining,
      autoRenew: detail.autoRenew,
      frozenUntil: detail.frozenUntil,
    };

    this.historyState.update((history) => {
      const index = history.findIndex((item) => item.id === detail.id);
      if (index === -1) return history;
      return history.map((item, itemIndex) => (itemIndex === index ? summary : item));
    });

    const current = this.currentState();
    if (current?.id === detail.id) {
      this.currentState.set(
        detail.status === 'Active' || detail.status === 'Frozen' ? detail : null,
      );
    } else if (!current && (detail.status === 'Active' || detail.status === 'Frozen')) {
      this.currentState.set(detail);
    }
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The memberships API is not reachable. Start the demo host on port 5084.';
      }
      if (error.status === 404) return 'The membership could not be found.';
      if (error.status === 409) {
        return 'You already have a membership covering this period. Cancel or let it expire before starting another.';
      }
      if (error.status === 403) {
        return 'This demo needs the X-Demo-Member header for the signed-in member.';
      }
      return (error.error as { message?: string } | null)?.message ?? 'The request failed. Try again.';
    }

    return 'The request failed. Try again.';
  }
}
