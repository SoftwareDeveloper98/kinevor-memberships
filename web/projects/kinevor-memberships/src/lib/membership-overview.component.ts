import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BILLING_PERIOD_LABELS, MembershipDetail, MembershipSummary } from './membership.model';
import { MembershipsFacade } from './memberships.facade';

/** Member subscription dashboard: current cover, lifecycle actions and history. */
@Component({
  selector: 'kinevor-membership-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container overview-page">
      <div class="page-header">
        <div class="header-copy">
          <span class="eyebrow">Membership</span>
          <h1 class="page-title">My membership</h1>
          <p class="header-sub">Your cover, renewals and membership history in one place.</p>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/memberships/plans">
            <mat-icon aria-hidden="true">grid_view</mat-icon>
            Browse plans
          </a>
          <button mat-stroked-button type="button" (click)="refresh()" [disabled]="facade.overviewLoading()">
            <mat-icon aria-hidden="true">refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

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

      @if (facade.overviewLoading()) {
        <div class="table-loading" role="status">
          <mat-spinner diameter="48" />
          <span>Loading your membership…</span>
        </div>
      } @else if (facade.current(); as current) {
        <section class="current-grid">
          <article class="current-hero">
            <div class="hero-top">
              <span class="kx-eyebrow">Current cover</span>
              <span class="status-chip" [class]="'status-' + current.status.toLowerCase()">
                {{ current.status }}
              </span>
            </div>
            <div class="hero-heading">
              <div>
                <h2>{{ current.planName }}</h2>
                <p>{{ current.tier }} tier · {{ periodLabel(current) }}</p>
              </div>
              <span class="hero-emblem" aria-hidden="true">
                <mat-icon>{{ current.tier === 'Elite' ? 'workspace_premium' : 'bolt' }}</mat-icon>
              </span>
            </div>

            <div class="cover-progress">
              <div class="progress-labels">
                <span>{{ current.startDate | date: 'mediumDate' }}</span>
                <span>{{ current.endDate | date: 'mediumDate' }}</span>
              </div>
              <div class="progress-track" role="progressbar" [attr.aria-valuenow]="progress(current)" aria-valuemin="0" aria-valuemax="100">
                <span [style.width.%]="progress(current)"></span>
              </div>
              <div class="progress-meta">
                <strong>{{ current.daysRemaining }} days remaining</strong>
                <span>{{ current.autoRenew ? 'Auto-renew on' : 'Manual renewal' }}</span>
              </div>
            </div>

            <div class="hero-actions">
              @if (current.status === 'Frozen') {
                <button mat-flat-button color="primary" type="button" [disabled]="facade.actionLoading()" (click)="resume(current)">
                  <mat-icon aria-hidden="true">play_circle</mat-icon>
                  Resume membership
                </button>
              } @else {
                <button mat-flat-button color="primary" type="button" [disabled]="facade.actionLoading()" (click)="renew(current)">
                  <mat-icon aria-hidden="true">autorenew</mat-icon>
                  Renew one period
                </button>
                <a mat-stroked-button [routerLink]="['/memberships', current.id]">
                  <mat-icon aria-hidden="true">tune</mat-icon>
                  Manage &amp; freeze
                </a>
              }
            </div>
          </article>

          <aside class="side-stack">
            <article class="side-card">
              <div class="side-head">
                <span class="side-icon"><mat-icon aria-hidden="true">receipt_long</mat-icon></span>
                <div>
                  <span class="side-label">Paid this period</span>
                  <strong class="side-value">{{ money(current.price, current.currency) }}</strong>
                </div>
              </div>
              <dl class="side-facts">
                <div><dt>Billing</dt><dd>{{ current.billingPeriod }}</dd></div>
                <div><dt>Cover length</dt><dd>{{ current.durationDays }} days</dd></div>
                <div><dt>Plan started</dt><dd>{{ current.startDate | date: 'mediumDate' }}</dd></div>
              </dl>
            </article>

            <article class="side-card">
              <div class="side-head">
                <span class="side-icon side-icon-info"><mat-icon aria-hidden="true">calendar_month</mat-icon></span>
                <div>
                  <span class="side-label">Next renewal</span>
                  <strong class="side-value">{{ current.endDate | date: 'mediumDate' }}</strong>
                </div>
              </div>
              <p class="side-copy">
                {{ current.autoRenew
                  ? 'Your membership is set to continue automatically at the end of this period.'
                  : 'Auto-renew is off. Renew before the end date to keep your cover continuous.' }}
              </p>
              <div class="side-link-row">
                <a mat-button routerLink="/memberships/plans">View plan benefits</a>
                <button mat-button type="button" class="danger-link" (click)="showCancel = !showCancel">
                  Cancel membership
                </button>
              </div>
            </article>
          </aside>
        </section>

        @if (showCancel) {
          <section class="cancel-panel" role="alertdialog" aria-label="Cancel membership">
            <span class="cancel-icon"><mat-icon aria-hidden="true">warning_amber</mat-icon></span>
            <div class="cancel-copy">
              <strong>Cancel this membership?</strong>
              <p>
                Access ends immediately and cancelled memberships cannot be resumed or
                renewed. You can start a new plan later.
              </p>
            </div>
            <div class="cancel-actions">
              <button mat-stroked-button type="button" (click)="showCancel = false">Keep membership</button>
              <button mat-flat-button type="button" class="danger-button" [disabled]="facade.actionLoading()" (click)="cancel(current)">
                Cancel membership
              </button>
            </div>
          </section>
        }

        <section class="stats-row" aria-label="Membership summary">
          <div class="stat-card">
            <span class="stat-icon stat-icon-accent"><mat-icon aria-hidden="true">timer</mat-icon></span>
            <div><span class="stat-value">{{ current.daysRemaining }}</span><span class="stat-label">Days left</span></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon stat-icon-success"><mat-icon aria-hidden="true">event_available</mat-icon></span>
            <div><span class="stat-value">{{ current.durationDays }}</span><span class="stat-label">Days per period</span></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon stat-icon-info"><mat-icon aria-hidden="true">sync</mat-icon></span>
            <div><span class="stat-value">{{ current.autoRenew ? 'On' : 'Off' }}</span><span class="stat-label">Auto-renew</span></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon stat-icon-warning"><mat-icon aria-hidden="true">history</mat-icon></span>
            <div><span class="stat-value">{{ facade.historyCount() }}</span><span class="stat-label">Subscriptions</span></div>
          </div>
        </section>

        <section class="feature-panel">
          <div class="section-head">
            <div>
              <span class="eyebrow">Included</span>
              <h2>Everything in {{ current.planName }}</h2>
            </div>
            <a mat-button [routerLink]="['/memberships', current.id]">View full detail</a>
          </div>
          <ul class="included-grid">
            @for (feature of current.features; track feature) {
              <li><mat-icon aria-hidden="true">check_circle</mat-icon>{{ feature }}</li>
            }
          </ul>
        </section>
      } @else {
        <section class="empty-hero">
          <span class="empty-icon"><mat-icon aria-hidden="true">card_membership</mat-icon></span>
          <span class="kx-eyebrow">No active cover</span>
          <h2>Your next chapter starts with a plan.</h2>
          <p>
            There is no active membership linked to this member. Explore the catalogue
            and start a plan in a few clicks.
          </p>
          <a mat-flat-button color="primary" routerLink="/memberships/plans">
            <mat-icon aria-hidden="true">grid_view</mat-icon>
            Explore membership plans
          </a>
        </section>
      }

      @if (!facade.overviewLoading() && facade.history().length > 0) {
        <section class="history-section">
          <div class="section-head">
            <div>
              <span class="eyebrow">Record</span>
              <h2>Subscription history</h2>
            </div>
            <span class="muted-note">{{ facade.historyCount() }} total</span>
          </div>

          <div class="history-list">
            @for (membership of facade.history(); track membership.id) {
              <a class="history-card" [routerLink]="['/memberships', membership.id]">
                <span class="history-icon" [class]="'history-icon-' + membership.status.toLowerCase()">
                  <mat-icon aria-hidden="true">{{ statusIcon(membership.status) }}</mat-icon>
                </span>
                <div class="history-main">
                  <div class="history-title-row">
                    <strong>{{ membership.planName }}</strong>
                    <span class="status-chip" [class]="'status-' + membership.status.toLowerCase()">
                      {{ membership.status }}
                    </span>
                  </div>
                  <span class="history-dates">
                    {{ membership.startDate | date: 'mediumDate' }} – {{ membership.endDate | date: 'mediumDate' }}
                  </span>
                </div>
                <div class="history-side">
                  <span class="history-price">{{ money(membership.price, membership.currency) }}</span>
                  <span class="history-period">{{ membership.billingPeriod }}</span>
                </div>
                <mat-icon class="history-chevron" aria-hidden="true">chevron_right</mat-icon>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .overview-page { display:flex; flex-direction:column; gap:14px; }
    .header-copy { display:flex; flex-direction:column; gap:3px; flex:1; min-width:240px; }
    .eyebrow { font-size:10px; font-weight:800; letter-spacing:.15em; text-transform:uppercase; color:var(--color-accent-text); }
    .page-title { margin:0; }
    .header-sub { margin:0; font-size:13px; color:var(--color-text-muted); }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .current-grid { display:grid; grid-template-columns:1fr; gap:12px; align-items:stretch; }
    .current-hero { position:relative; overflow:hidden; display:flex; flex-direction:column; gap:14px; padding:20px 24px; border-radius:24px; background:linear-gradient(140deg, color-mix(in srgb, var(--color-accent-fill) 25%, var(--color-surface-raised)) 0%, var(--color-surface-raised) 52%, var(--color-surface) 100%); border:1px solid color-mix(in srgb, var(--color-accent-fill) 28%, var(--color-border)); }
    .current-hero::after { content:''; position:absolute; width:280px; height:280px; border-radius:50%; inset-inline-end:-100px; bottom:-150px; background:color-mix(in srgb, var(--color-accent-fill) 12%, transparent); filter:blur(18px); pointer-events:none; }
    .hero-top { display:flex; align-items:center; justify-content:space-between; gap:10px; position:relative; }
    .kx-eyebrow { color:color-mix(in srgb, var(--color-text) 75%, var(--color-accent-text)); }
    .hero-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; position:relative; }
    .hero-heading h2 { margin:0; font-size:clamp(32px, 4vw, 46px); line-height:1.02; letter-spacing:-.045em; }
    .hero-heading p { margin:6px 0 0; font-size:12px; font-weight:600; color:var(--color-text-muted); }
    .hero-emblem { width:56px; height:56px; border-radius:16px; display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--color-accent-fill) 18%, transparent); color:var(--color-accent-text); flex:none; }
    .hero-emblem mat-icon { font-size:28px; width:28px; height:28px; }
    .cover-progress { position:relative; display:flex; flex-direction:column; gap:7px; }
    .progress-labels { display:flex; justify-content:space-between; gap:10px; font-size:10px; color:var(--color-text-muted); }
    .progress-track { height:8px; border-radius:999px; background:color-mix(in srgb, var(--color-ink) 55%, transparent); overflow:hidden; }
    .progress-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg, var(--color-accent-fill), color-mix(in srgb, var(--color-accent-fill) 55%, var(--color-warning))); }
    .progress-meta { display:flex; justify-content:space-between; gap:10px; font-size:11px; color:var(--color-text-muted); }
    .progress-meta strong { color:var(--color-text); font-size:12px; }
    .hero-actions { position:relative; display:flex; gap:8px; flex-wrap:wrap; }
    .side-stack { display:flex; flex-direction:column; gap:12px; }
    .side-card { display:flex; flex-direction:column; gap:9px; padding:15px; border-radius:18px; background:var(--color-surface-raised); border:1px solid var(--color-border); flex:1; }
    .side-head { display:flex; align-items:center; gap:11px; }
    .side-icon { width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; background:var(--color-accent-soft); color:var(--color-accent-text); flex:none; }
    .side-icon-info { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .side-icon mat-icon { font-size:18px; width:18px; height:18px; }
    .side-label { display:block; font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--color-text-muted); }
    .side-value { display:block; margin-top:2px; font-size:17px; letter-spacing:-.02em; }
    .side-facts { display:flex; flex-direction:column; margin:0; }
    .side-facts div { display:flex; justify-content:space-between; gap:10px; padding:5px 0; border-bottom:1px solid var(--color-border); font-size:11.5px; }
    .side-facts div:last-child { border-bottom:none; }
    .side-facts dt { color:var(--color-text-muted); }
    .side-facts dd { margin:0; font-weight:600; }
    .side-copy { margin:0; font-size:11.5px; line-height:1.55; color:var(--color-text-muted); }
    .side-link-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:auto; }
    .side-link-row a, .side-link-row button { padding-inline:0; min-width:0; }
    .danger-link { color:var(--color-error) !important; }
    .cancel-panel { display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap; padding:16px; border-radius:16px; background:color-mix(in srgb, var(--color-error) 9%, var(--color-surface-raised)); border:1px solid color-mix(in srgb, var(--color-error) 40%, transparent); }
    .cancel-icon { width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--color-error) 14%, transparent); color:var(--color-error); flex:none; }
    .cancel-copy { flex:1; min-width:220px; }
    .cancel-copy strong { display:block; font-size:13px; }
    .cancel-copy p { margin:3px 0 0; font-size:11.5px; line-height:1.5; color:var(--color-text-muted); }
    .cancel-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .danger-button { background:var(--color-error) !important; color:var(--color-on-accent) !important; }
    .stats-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .stat-card { display:flex; align-items:center; gap:10px; padding:11px 13px; border-radius:14px; background:var(--color-surface-raised); border:1px solid var(--color-border); }
    .stat-icon { width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
    .stat-icon mat-icon { font-size:19px; width:19px; height:19px; }
    .stat-icon-accent { background:var(--color-accent-soft); color:var(--color-accent-text); }
    .stat-icon-success { background:color-mix(in srgb, var(--color-success) 14%, transparent); color:var(--color-success); }
    .stat-icon-info { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .stat-icon-warning { background:color-mix(in srgb, var(--color-warning) 14%, transparent); color:var(--color-warning); }
    .stat-value { display:block; font-size:20px; font-weight:800; line-height:1.1; letter-spacing:-.02em; }
    .stat-label { display:block; margin-top:2px; font-size:9px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--color-text-muted); }
    .feature-panel { padding:17px 20px; border-radius:18px; background:var(--color-surface); border:1px solid var(--color-border); }
    .section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:0; }
    .section-head h2 { margin:4px 0 0; font-size:21px; letter-spacing:-.03em; }
    .included-grid { list-style:none; display:grid; grid-template-columns:1fr; gap:7px 18px; margin:10px 0 0; padding:0; }
    .included-grid li { display:flex; align-items:flex-start; gap:7px; font-size:12px; line-height:1.5; color:var(--color-text-muted); }
    .included-grid mat-icon { font-size:15px; width:15px; height:15px; color:var(--color-success); margin-top:1px; flex:none; }
    .empty-hero { display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding:36px; border-radius:24px; background:linear-gradient(135deg, color-mix(in srgb, var(--color-accent-fill) 16%, var(--color-surface-raised)), var(--color-surface-raised)); border:1px solid var(--color-border); }
    .empty-icon { width:54px; height:54px; border-radius:16px; background:var(--color-accent-soft); color:var(--color-accent-text); display:inline-flex; align-items:center; justify-content:center; }
    .empty-icon mat-icon { font-size:27px; width:27px; height:27px; }
    .empty-hero h2 { margin:0; font-size:clamp(26px, 3vw, 38px); letter-spacing:-.04em; max-width:16ch; }
    .empty-hero p { margin:0; max-width:56ch; font-size:13px; line-height:1.65; color:var(--color-text-muted); }
    .empty-hero a { margin-top:6px; }
    .history-section { display:flex; flex-direction:column; gap:10px; }
    .history-list { display:flex; flex-direction:column; gap:7px; }
    .history-card { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:14px; background:var(--color-surface-raised); border:1px solid var(--color-border); color:var(--color-text); transition:border-color .2s ease, transform .2s ease; }
    .history-card:hover { border-color:color-mix(in srgb, var(--color-accent-fill) 38%, transparent); transform:translateY(-1px); }
    .history-icon { width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; flex:none; background:var(--color-accent-soft); color:var(--color-accent-text); }
    .history-icon mat-icon { font-size:18px; width:18px; height:18px; }
    .history-icon-frozen { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .history-icon-cancelled { background:color-mix(in srgb, var(--color-error) 12%, transparent); color:var(--color-error); }
    .history-icon-expired { background:color-mix(in srgb, var(--color-text-muted) 12%, transparent); color:var(--color-text-muted); }
    .history-main { flex:1; min-width:0; }
    .history-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .history-title-row strong { font-size:14px; }
    .history-dates { display:block; margin-top:2px; font-size:11px; color:var(--color-text-muted); }
    .history-side { text-align:end; }
    .history-price { display:block; font-size:13px; font-weight:700; }
    .history-period { display:block; font-size:10px; color:var(--color-text-muted); }
    .history-chevron { color:var(--color-text-muted); }
    @media (min-width: 720px) {
      .stats-row { grid-template-columns:repeat(4,minmax(0,1fr)); }
      .included-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (min-width: 960px) {
      .current-grid { grid-template-columns:1.55fr .75fr; }
      .included-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    }
  `],
})
export class MembershipOverviewComponent implements OnInit {
  /** Facade that owns current-cover and history state. */
  readonly facade = inject(MembershipsFacade);
  private readonly router = inject(Router);

  /** Whether the cancellation confirmation is visible. */
  showCancel = false;
  /** Success message shown after an action. */
  flash: string | null = null;

  /** Loads the dashboard. */
  ngOnInit(): void {
    void this.facade.loadOverview();
  }

  /** Reloads the dashboard. */
  refresh(): void {
    this.flash = null;
    void this.facade.loadOverview();
  }

  /**
   * Renews the current subscription by one period.
   *
   * @param current - Current subscription.
   */
  async renew(current: MembershipDetail): Promise<void> {
    const updated = await this.facade.renew(current.id, 1);
    if (updated) this.flash = `Membership renewed through ${this.formatDate(updated.endDate)}.`;
  }

  /**
   * Resumes a frozen subscription.
   *
   * @param current - Current frozen subscription.
   */
  async resume(current: MembershipDetail): Promise<void> {
    const updated = await this.facade.resume(current.id);
    if (updated) this.flash = 'Membership resumed. Your remaining cover has been restored.';
  }

  /**
   * Cancels the current subscription after confirmation.
   *
   * @param current - Current subscription.
   */
  async cancel(current: MembershipDetail): Promise<void> {
    const updated = await this.facade.cancel(current.id);
    if (updated) {
      this.showCancel = false;
      this.flash = 'Membership cancelled. You can start a new plan whenever you are ready.';
    }
  }

  /**
   * Returns the percentage of cover used.
   *
   * @param membership - Subscription row.
   * @returns Whole percentage between 0 and 100.
   */
  progress(membership: MembershipSummary): number {
    const start = new Date(membership.startDate).getTime();
    const end = new Date(membership.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    const used = ((Date.now() - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, Math.round(used)));
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
   * Returns the billing cadence label.
   *
   * @param membership - Subscription row.
   * @returns Billing period label.
   */
  periodLabel(membership: MembershipSummary): string {
    return BILLING_PERIOD_LABELS[membership.billingPeriod];
  }

  /**
   * Returns the status icon used in history rows.
   *
   * @param status - Membership status.
   * @returns Material icon name.
   */
  statusIcon(status: MembershipSummary['status']): string {
    return status === 'Active'
      ? 'verified'
      : status === 'Frozen'
        ? 'ac_unit'
        : status === 'Cancelled'
          ? 'block'
          : 'event_busy';
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}
