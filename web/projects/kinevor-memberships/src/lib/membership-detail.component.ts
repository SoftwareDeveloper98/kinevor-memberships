import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BILLING_PERIOD_LABELS, MembershipDetail } from './membership.model';
import { MembershipsFacade } from './memberships.facade';

/** Detail view for one subscription with freeze, renew, resume and cancel controls. */
@Component({
  selector: 'kinevor-membership-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container detail-page">
      <a mat-button routerLink="/memberships" class="back-link">
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
        Back to membership
      </a>

      @if (facade.error(); as error) {
        <p class="notice notice-error" role="alert">
          <mat-icon aria-hidden="true">error</mat-icon>{{ error }}
        </p>
      }

      @if (flash) {
        <p class="notice notice-success" role="status">
          <mat-icon aria-hidden="true">check_circle</mat-icon>{{ flash }}
        </p>
      }

      @if (facade.detailLoading()) {
        <div class="table-loading" role="status">
          <mat-spinner diameter="48" />
          <span>Loading membership detail…</span>
        </div>
      } @else if (facade.detail(); as membership) {
        <section class="detail-hero">
          <div class="hero-main">
            <div class="hero-top">
              <span class="kx-eyebrow">Membership detail</span>
              <span class="status-chip" [class]="'status-' + membership.status.toLowerCase()">
                {{ membership.status }}
              </span>
            </div>
            <h1 class="page-title">{{ membership.planName }}</h1>
            <p class="hero-sub">
              {{ membership.tier }} tier · {{ periodLabel(membership.billingPeriod) }} ·
              {{ membership.durationDays }}-day cover
            </p>
            <div class="hero-tags">
              <span><mat-icon aria-hidden="true">auto_awesome</mat-icon>{{ membership.features.length }} benefits included</span>
              <span><mat-icon aria-hidden="true">schedule</mat-icon>{{ membership.daysRemaining }} days left</span>
              <span>
                <mat-icon aria-hidden="true">{{ membership.autoRenew ? 'sync' : 'sync_disabled' }}</mat-icon>
                {{ membership.autoRenew ? 'Auto-renew on' : 'Manual renewal' }}
              </span>
            </div>
          </div>
          <div class="hero-side">
            <span class="hero-label">{{ membership.status === 'Active' || membership.status === 'Frozen' ? 'Cover ends' : 'Access ended' }}</span>
            <strong class="hero-date">{{ membership.endDate | date: 'dd MMM yyyy' }}</strong>
            <span class="hero-price">{{ money(membership.price, membership.currency) }} · {{ membership.billingPeriod }}</span>
          </div>
        </section>

        <div class="detail-grid">
          <div class="detail-main">
            <section class="panel">
              <div class="section-head">
                <div>
                  <span class="eyebrow">Subscription</span>
                  <h2>Cover details</h2>
                </div>
                <span class="status-chip" [class]="'status-' + membership.status.toLowerCase()">
                  {{ membership.status }}
                </span>
              </div>
              <dl class="facts-grid">
                <div><dt>Tier</dt><dd>{{ membership.tier }}</dd></div>
                <div><dt>Billing period</dt><dd>{{ membership.billingPeriod }}</dd></div>
                <div><dt>Cover length</dt><dd>{{ membership.durationDays }} days</dd></div>
                <div><dt>Start date</dt><dd>{{ membership.startDate | date: 'mediumDate' }}</dd></div>
                <div><dt>End date</dt><dd>{{ membership.endDate | date: 'mediumDate' }}</dd></div>
                <div><dt>Auto-renew</dt><dd>{{ membership.autoRenew ? 'Enabled' : 'Disabled' }}</dd></div>
                <div><dt>Days remaining</dt><dd>{{ membership.daysRemaining }}</dd></div>
                <div><dt>Created</dt><dd>{{ membership.createdAt | date: 'mediumDate' }}</dd></div>
                <div><dt>Price</dt><dd>{{ money(membership.price, membership.currency) }}</dd></div>
                @if (membership.notes) {
                  <div class="fact-wide"><dt>Notes</dt><dd>{{ membership.notes }}</dd></div>
                }
                @if (membership.freezeReason) {
                  <div class="fact-wide"><dt>Freeze reason</dt><dd>{{ membership.freezeReason }}</dd></div>
                }
              </dl>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <span class="eyebrow">Plan snapshot</span>
                  <h2>What is included</h2>
                </div>
                <span class="muted-note">Captured at start</span>
              </div>
              @if (membership.features.length > 0) {
                <ul class="included-grid">
                  @for (feature of membership.features; track feature) {
                    <li><mat-icon aria-hidden="true">check_circle</mat-icon>{{ feature }}</li>
                  }
                </ul>
              } @else {
                <p class="muted-note">No feature snapshot was recorded for this plan.</p>
              }
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <span class="eyebrow">Timeline</span>
                  <h2>Lifecycle</h2>
                </div>
              </div>
              <ol class="timeline">
                <li>
                  <span class="timeline-dot timeline-dot-start"></span>
                  <div><strong>Started</strong><span>{{ membership.startDate | date: 'mediumDate' }}</span></div>
                </li>
                @if (membership.frozenFrom) {
                  <li>
                    <span class="timeline-dot timeline-dot-frozen"></span>
                    <div><strong>Frozen</strong><span>{{ membership.frozenFrom | date: 'mediumDate' }}</span></div>
                  </li>
                }
                @if (membership.frozenUntil) {
                  <li>
                    <span class="timeline-dot timeline-dot-live"></span>
                    <div>
                      <strong>Freeze scheduled through</strong>
                      <span>{{ membership.frozenUntil | date: 'mediumDate' }}</span>
                    </div>
                  </li>
                }
                <li>
                  <span class="timeline-dot" [class.timeline-dot-end]="membership.status !== 'Cancelled'"></span>
                  <div>
                    <strong>{{ membership.status === 'Active' || membership.status === 'Frozen' ? 'Cover ends' : 'Access ended' }}</strong>
                    <span>{{ membership.endDate | date: 'mediumDate' }}</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>

          <aside class="detail-side">
            <section class="panel action-panel">
              <div class="section-head">
                <div>
                  <span class="eyebrow">Manage</span>
                  <h2>Membership actions</h2>
                </div>
              </div>
              <p class="muted-note action-intro">
                Actions apply immediately. Frozen days are added to the end of your cover.
              </p>

              @if (membership.status === 'Frozen') {
                <button mat-flat-button color="primary" type="button" [disabled]="facade.actionLoading()" (click)="resume(membership)">
                  <mat-icon aria-hidden="true">play_circle</mat-icon>
                  Resume cover
                </button>
                <button mat-stroked-button type="button" [disabled]="facade.actionLoading()" (click)="renew(membership)">
                  <mat-icon aria-hidden="true">autorenew</mat-icon>
                  Renew while frozen
                </button>
              } @else if (membership.status === 'Active') {
                <button mat-flat-button color="primary" type="button" [disabled]="facade.actionLoading()" (click)="renew(membership)">
                  <mat-icon aria-hidden="true">autorenew</mat-icon>
                  Renew {{ renewPeriods }} {{ renewPeriods === 1 ? 'period' : 'periods' }}
                </button>
                <div class="renew-options" role="group" aria-label="Renewal periods">
                  @for (period of renewalOptions; track period) {
                    <button
                      class="renew-option"
                      type="button"
                      [class.is-selected]="renewPeriods === period"
                      [attr.aria-pressed]="renewPeriods === period"
                      (click)="renewPeriods = period"
                    >
                      {{ period }}
                    </button>
                  }
                </div>
                <button mat-stroked-button type="button" [disabled]="facade.actionLoading()" (click)="freeze(membership)">
                  <mat-icon aria-hidden="true">ac_unit</mat-icon>
                  Freeze cover
                </button>
                <div class="renew-options" role="group" aria-label="Freeze duration">
                  @for (days of freezeOptions; track days) {
                    <button
                      class="renew-option"
                      type="button"
                      [class.is-selected]="freezeDays === days"
                      [attr.aria-pressed]="freezeDays === days"
                      (click)="freezeDays = days"
                    >
                      {{ days }}d
                    </button>
                  }
                </div>
              } @else if (membership.status === 'Expired') {
                <p class="muted-note">
                  This period has ended. Renew to restart cover from today, or choose a
                  different plan.
                </p>
                <button mat-flat-button color="primary" type="button" [disabled]="facade.actionLoading()" (click)="renew(membership)">
                  <mat-icon aria-hidden="true">autorenew</mat-icon>
                  Renew {{ renewPeriods }} {{ renewPeriods === 1 ? 'period' : 'periods' }}
                </button>
                <div class="renew-options" role="group" aria-label="Renewal periods">
                  @for (period of renewalOptions; track period) {
                    <button
                      class="renew-option"
                      type="button"
                      [class.is-selected]="renewPeriods === period"
                      [attr.aria-pressed]="renewPeriods === period"
                      (click)="renewPeriods = period"
                    >
                      {{ period }}
                    </button>
                  }
                </div>
                <a mat-stroked-button routerLink="/memberships/plans">
                  <mat-icon aria-hidden="true">grid_view</mat-icon>
                  Browse plans
                </a>
              } @else {
                <p class="muted-note">
                  This membership is cancelled and cannot be changed. Start a new plan
                  when you are ready to train again.
                </p>
                <a mat-flat-button color="primary" routerLink="/memberships/plans">
                  <mat-icon aria-hidden="true">grid_view</mat-icon>
                  Browse plans
                </a>
              }

              @if ((membership.status === 'Active' || membership.status === 'Frozen') && !showCancel) {
                <button mat-button type="button" class="danger-link" (click)="showCancel = true">
                  Cancel membership
                </button>
              }
            </section>

            @if ((membership.status === 'Active' || membership.status === 'Frozen') && showCancel) {
              <section class="panel cancel-panel" role="alertdialog" aria-label="Cancel membership">
                <div class="cancel-head">
                  <span class="cancel-icon"><mat-icon aria-hidden="true">warning_amber</mat-icon></span>
                  <strong>Cancel this membership?</strong>
                </div>
                <p class="muted-note">
                  Access ends immediately. Cancelled memberships cannot be resumed,
                  renewed or reactivated.
                </p>
                <div class="cancel-actions">
                  <button mat-stroked-button type="button" (click)="showCancel = false">Keep cover</button>
                  <button mat-flat-button type="button" class="danger-button" [disabled]="facade.actionLoading()" (click)="cancel(membership)">
                    Confirm cancel
                  </button>
                </div>
              </section>
            }

            <section class="panel assist-panel">
              <mat-icon aria-hidden="true">support_agent</mat-icon>
              <div>
                <strong>Need a hand?</strong>
                <p>Speak to the club team about changes to this subscription.</p>
              </div>
            </section>
          </aside>
        </div>
      } @else if (!facade.detailLoading() && !facade.error()) {
        <section class="panel not-found">
          <mat-icon aria-hidden="true">search_off</mat-icon>
          <h2>Membership not found</h2>
          <p>The subscription may have been removed or belongs to another member.</p>
          <a mat-flat-button color="primary" routerLink="/memberships">Return to membership</a>
        </section>
      }
    </div>
  `,
  styles: [`
    .detail-page { display:flex; flex-direction:column; gap:12px; padding-top:16px; }
    .back-link { align-self:flex-start; padding-inline:0; }
    .detail-hero { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; flex-wrap:wrap; padding:22px 26px; border-radius:24px; background:linear-gradient(135deg, color-mix(in srgb, var(--color-accent-fill) 22%, var(--color-surface-raised)), var(--color-surface-raised) 60%, var(--color-surface)); border:1px solid color-mix(in srgb, var(--color-accent-fill) 25%, var(--color-border)); }
    .hero-main { flex:1; min-width:260px; }
    .hero-top { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .page-title { margin:0; font-size:clamp(30px, 3.4vw, 42px); line-height:1.02; letter-spacing:-.045em; }
    .hero-sub { margin:6px 0 0; font-size:12.5px; font-weight:600; color:var(--color-text-muted); }
    .hero-tags { display:flex; flex-wrap:wrap; gap:7px 16px; margin-top:10px; }
    .hero-tags span { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:var(--color-text-muted); }
    .hero-tags mat-icon { font-size:15px; width:15px; height:15px; color:var(--color-accent-text); }
    .hero-side { text-align:end; }
    .hero-label { display:block; font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--color-text-muted); }
    .hero-date { display:block; margin-top:3px; font-size:24px; letter-spacing:-.03em; }
    .hero-price { display:block; margin-top:2px; font-size:11px; color:var(--color-text-muted); }
    .detail-grid { display:grid; grid-template-columns:1fr; gap:14px; align-items:start; }
    .detail-main, .detail-side { display:flex; flex-direction:column; gap:12px; }
    .panel { padding:18px; border-radius:18px; background:var(--color-surface-raised); border:1px solid var(--color-border); }
    .section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:0; }
    .eyebrow { font-size:9px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--color-accent-text); }
    .section-head h2 { margin:4px 0 0; font-size:20px; letter-spacing:-.03em; }
    .facts-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 20px; margin:12px 0 0; }
    .facts-grid div { display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-bottom:1px solid var(--color-border); font-size:11.5px; }
    .facts-grid dt { color:var(--color-text-muted); }
    .facts-grid dd { margin:0; font-weight:600; text-align:end; overflow-wrap:anywhere; }
    
    .fact-wide { grid-column:1 / -1; }
    .included-grid { list-style:none; display:grid; grid-template-columns:1fr; gap:7px 18px; margin:10px 0 0; padding:0; }
    .included-grid li { display:flex; align-items:flex-start; gap:7px; font-size:12px; line-height:1.5; color:var(--color-text-muted); }
    .included-grid mat-icon { font-size:15px; width:15px; height:15px; color:var(--color-success); margin-top:1px; flex:none; }
    .timeline { list-style:none; display:flex; flex-direction:column; gap:0; margin:12px 0 0; padding:0 0 0 4px; }
    .timeline li { position:relative; display:flex; gap:12px; padding:0 0 14px 18px; border-inline-start:1px solid var(--color-border); }
    .timeline li:last-child { padding-bottom:0; border-inline-start-color:transparent; }
    .timeline-dot { position:absolute; inset-inline-start:-5px; top:3px; width:9px; height:9px; border-radius:50%; background:var(--color-text-muted); border:2px solid var(--color-surface-raised); }
    .timeline-dot-start { background:var(--color-accent-fill); }
    .timeline-dot-live { background:var(--color-success); }
    .timeline-dot-frozen { background:var(--color-info); }
    .timeline-dot-cancelled { background:var(--color-error); }
    .timeline-dot-end { background:var(--color-warning); }
    .timeline strong { display:block; font-size:11.5px; }
    .timeline span { display:block; margin-top:2px; font-size:10.5px; color:var(--color-text-muted); }
    .action-panel { display:flex; flex-direction:column; gap:9px; }
    .action-intro { margin:0 0 2px; }
    .action-panel > a, .action-panel > button { width:100%; }
    .renew-options { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:5px; }
    .renew-option { border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-muted); border-radius:8px; padding:6px 2px; font:inherit; font-size:10.5px; font-weight:700; cursor:pointer; }
    .renew-option:hover { border-color:color-mix(in srgb, var(--color-accent-fill) 40%, transparent); color:var(--color-text); }
    .renew-option.is-selected { background:var(--color-accent-soft); border-color:color-mix(in srgb, var(--color-accent-fill) 50%, transparent); color:var(--color-accent-text); }
    .renew-options:nth-of-type(2) { grid-template-columns:repeat(5,minmax(0,1fr)); }
    .danger-link { color:var(--color-error) !important; }
    .cancel-panel { display:flex; flex-direction:column; gap:10px; background:color-mix(in srgb, var(--color-error) 7%, var(--color-surface-raised)); border-color:color-mix(in srgb, var(--color-error) 36%, transparent); }
    .cancel-head { display:flex; align-items:center; gap:9px; }
    .cancel-icon { width:32px; height:32px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--color-error) 14%, transparent); color:var(--color-error); }
    .cancel-icon mat-icon { font-size:17px; width:17px; height:17px; }
    .cancel-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .danger-button { background:var(--color-error) !important; color:var(--color-on-accent) !important; }
    .assist-panel { display:flex; gap:11px; align-items:flex-start; }
    .assist-panel > mat-icon { color:var(--color-accent-text); }
    .assist-panel strong { display:block; font-size:12px; }
    .assist-panel p { margin:2px 0 0; font-size:11px; line-height:1.5; color:var(--color-text-muted); }
    .not-found { display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
    .not-found > mat-icon { color:var(--color-text-muted); }
    .not-found h2 { margin:0; }
    .not-found p { margin:0 0 4px; color:var(--color-text-muted); font-size:13px; }
    @media (min-width: 720px) { .included-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (min-width: 960px) {
      .detail-grid { grid-template-columns:minmax(0, 1.5fr) minmax(280px, .7fr); }
      .facts-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .included-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    }
  `],
})
export class MembershipDetailComponent implements OnInit {
  /** Facade that owns detail state and lifecycle actions. */
  readonly facade = inject(MembershipsFacade);
  private readonly route = inject(ActivatedRoute);

  /** Subscription identifier from the route. */
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  /** Selected number of renewal periods. */
  renewPeriods = 1;
  /** Selected freeze duration in days. */
  freezeDays = 30;
  /** Available renewal period options. */
  readonly renewalOptions = [1, 2, 3, 4, 6];
  /** Available freeze duration options. */
  readonly freezeOptions = [7, 14, 30, 60, 90];
  /** Whether the cancellation confirmation is visible. */
  showCancel = false;
  /** Success message shown after an action. */
  flash: string | null = null;

  /** Loads the subscription detail. */
  ngOnInit(): void {
    if (this.id) void this.facade.loadDetail(this.id);
  }

  /**
   * Freezes the subscription for the selected number of days.
   *
   * @param membership - Current subscription.
   */
  async freeze(membership: MembershipDetail): Promise<void> {
    const until = new Date();
    until.setDate(until.getDate() + this.freezeDays);
    const updated = await this.facade.freeze(membership.id, {
      until: until.toISOString(),
      reason: 'Self-service freeze from the member portal',
    });
    if (updated) this.flash = `Membership frozen for ${this.freezeDays} days. Your end date has been extended.`;
  }

  /**
   * Resumes a frozen subscription.
   *
   * @param membership - Current subscription.
   */
  async resume(membership: MembershipDetail): Promise<void> {
    const updated = await this.facade.resume(membership.id);
    if (updated) this.flash = 'Membership resumed. Your remaining cover is active again.';
  }

  /**
   * Renews the subscription for the selected number of periods.
   *
   * @param membership - Current subscription.
   */
  async renew(membership: MembershipDetail): Promise<void> {
    const updated = await this.facade.renew(membership.id, this.renewPeriods);
    if (updated) {
      this.flash = `Membership renewed for ${this.renewPeriods} ${this.renewPeriods === 1 ? 'period' : 'periods'}.`;
    }
  }

  /**
   * Cancels the subscription after confirmation.
   *
   * @param membership - Current subscription.
   */
  async cancel(membership: MembershipDetail): Promise<void> {
    const updated = await this.facade.cancel(membership.id);
    if (updated) {
      this.showCancel = false;
      this.flash = 'Membership cancelled. Cover has ended immediately.';
    }
  }

  /**
   * Formats a price with its currency symbol.
   *
   * @param value - Price amount.
   * @param currency - ISO 4217 code.
   * @returns Localised money string.
   */
  money(value: number, currency: string): string {
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${value.toLocaleString('en-GB', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Returns the human billing cadence.
   *
   * @param period - Billing period.
   * @returns Billing label.
   */
  periodLabel(period: MembershipDetail['billingPeriod']): string {
    return BILLING_PERIOD_LABELS[period];
  }
}

