import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BILLING_PERIOD_LABELS,
  TIER_LABELS,
  MembershipPlan,
} from './membership.model';
import { MembershipsFacade } from './memberships.facade';

/** Member-facing plan catalogue with current-cover context and start actions. */
@Component({
  selector: 'kinevor-plan-catalogue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container catalogue-page">
      <section class="catalogue-hero">
        <div class="hero-copy">
          <span class="eyebrow"><span class="kx-dot kx-dot-live"></span>Memberships</span>
          <h1>Choose how you train.</h1>
          <p>
            Three straightforward plans, no joining fee and the freedom to freeze when
            life gets in the way.
          </p>
          <div class="hero-assurances">
            <span><mat-icon aria-hidden="true">verified</mat-icon> No joining fee</span>
            <span><mat-icon aria-hidden="true">ac_unit</mat-icon> Freeze up to 90 days</span>
            <span><mat-icon aria-hidden="true">sync</mat-icon> Cancel any time</span>
          </div>
        </div>

        <aside class="cover-panel" aria-label="Current membership">
          @if (facade.current(); as current) {
            <span class="kx-eyebrow">Your current cover</span>
            <div class="cover-title-row">
              <h2>{{ current.planName }}</h2>
              <span class="status-chip" [class]="'status-' + current.status.toLowerCase()">
                {{ current.status }}
              </span>
            </div>
            <p class="cover-copy">
              {{ current.daysRemaining }} days of cover remaining. Renews
              {{ current.autoRenew ? 'automatically' : 'manually' }}.
            </p>
            <dl class="cover-facts">
              <div><dt>Ends</dt><dd>{{ current.endDate | date: 'mediumDate' }}</dd></div>
              <div><dt>Paid</dt><dd>{{ money(current.price, current.currency) }}</dd></div>
            </dl>
            <a mat-flat-button color="primary" routerLink="/memberships">
              <mat-icon aria-hidden="true">dashboard</mat-icon>
              Manage membership
            </a>
          } @else {
            <span class="kx-eyebrow">Your current cover</span>
            <h2 class="cover-empty-title">Ready when you are.</h2>
            <p class="cover-copy">
              No active subscription is linked to this member. Pick a plan to start
              training today. The first period begins immediately.
            </p>
            <div class="cover-empty-line">
              <mat-icon aria-hidden="true">bolt</mat-icon>
              Starting takes less than a minute
            </div>
          }
        </aside>
      </section>

      @if (facade.error(); as error) {
        <p class="notice notice-error" role="alert">
          <mat-icon aria-hidden="true">error</mat-icon>{{ error }}
        </p>
      }

      @if (facade.plansLoading()) {
        <div class="table-loading" role="status">
          <mat-spinner diameter="48" />
          <span>Loading membership plans…</span>
        </div>
      } @else {
        <div class="section-head plans-head">
          <div>
            <span class="eyebrow">Membership plans</span>
            <h2>One club. Three ways in.</h2>
          </div>
          <p class="muted-note">
            Prices in GBP. Billing period is shown under each plan.
          </p>
        </div>

        <div class="plan-grid">
          @for (plan of facade.plans(); track plan.id; let index = $index) {
            <article class="plan-card" [class.plan-featured]="plan.name === 'Performance'">
              @if (plan.name === 'Performance') {
                <span class="popular-badge">Most popular</span>
              }

              <header class="plan-head">
                <span class="plan-icon" [class]="'tier-' + plan.tier.toLowerCase()">
                  <mat-icon aria-hidden="true">{{ tierIcon(plan.tier) }}</mat-icon>
                </span>
                <div>
                  <span class="plan-tier">{{ plan.tier }} · {{ tierLabel(plan.tier) }}</span>
                  <h3>{{ plan.name }}</h3>
                </div>
              </header>

              <p class="plan-description">{{ plan.description }}</p>

              <div class="plan-price">
                <span class="price-value">{{ money(plan.price, plan.currency) }}</span>
                <span class="price-period">{{ periodLabel(plan.billingPeriod) }}</span>
              </div>
              <span class="price-detail">
                {{ plan.durationDays }} days of cover · {{ plan.billingPeriod }}
              </span>

              <ul class="feature-list">
                @for (feature of plan.features; track feature) {
                  <li><mat-icon aria-hidden="true">check</mat-icon>{{ feature }}</li>
                }
              </ul>

              <footer class="plan-foot">
                @if (facade.current()?.planId === plan.id) {
                  <a mat-flat-button color="primary" routerLink="/memberships">
                    <mat-icon aria-hidden="true">check_circle</mat-icon>
                    Your current plan
                  </a>
                } @else if (facade.current()) {
                  <button mat-stroked-button type="button" disabled>
                    <mat-icon aria-hidden="true">lock</mat-icon>
                    Current cover active
                  </button>
                  <span class="plan-foot-note">
                    Manage or cancel your current plan before switching.
                  </span>
                } @else {
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    [disabled]="facade.actionLoading()"
                    (click)="start(plan)"
                  >
                    <mat-icon aria-hidden="true">bolt</mat-icon>
                    Start {{ plan.name }}
                  </button>
                  <span class="plan-foot-note">
                    Begins today · renews {{ plan.billingPeriod.toLowerCase() }}
                  </span>
                }
              </footer>
            </article>
          }
        </div>

        <section class="value-band" aria-label="Membership benefits">
          <div class="value-item">
            <span class="value-icon"><mat-icon aria-hidden="true">calendar_month</mat-icon></span>
            <div>
              <strong>Flexible billing</strong>
              <p>Monthly, quarterly or annual. Choose the rhythm that suits you.</p>
            </div>
          </div>
          <div class="value-item">
            <span class="value-icon"><mat-icon aria-hidden="true">pause_circle</mat-icon></span>
            <div>
              <strong>Pause your cover</strong>
              <p>Freeze for up to 90 days and pick up exactly where you left off.</p>
            </div>
          </div>
          <div class="value-item">
            <span class="value-icon"><mat-icon aria-hidden="true">workspace_premium</mat-icon></span>
            <div>
              <strong>Upgrade without friction</strong>
              <p>Your plan benefits are captured at start, so nothing changes mid-term.</p>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .catalogue-page { display:flex; flex-direction:column; gap:20px; }
    .catalogue-hero { position:relative; display:grid; grid-template-columns:1fr; gap:22px; padding:26px; border-radius:28px; overflow:hidden; background:linear-gradient(135deg, color-mix(in srgb, var(--color-accent-fill) 20%, var(--color-surface-raised)) 0%, var(--color-surface-raised) 58%, var(--color-surface) 100%); border:1px solid var(--color-border); }
    .catalogue-hero::after { content:''; position:absolute; width:360px; height:360px; inset-inline-end:-120px; top:-160px; border-radius:50%; background:color-mix(in srgb, var(--color-accent-fill) 14%, transparent); filter:blur(20px); pointer-events:none; }
    .hero-copy { position:relative; display:flex; flex-direction:column; gap:14px; align-self:center; }
    .eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--color-accent-text); }
    .hero-copy h1 { margin:0; font-size:clamp(34px, 3vw, 46px); line-height:1.05; letter-spacing:-.045em; font-weight:800; max-width:14ch; }
    .hero-copy p { margin:0; max-width:56ch; font-size:15px; line-height:1.7; color:var(--color-text-muted); }
    .hero-assurances { display:flex; flex-wrap:wrap; gap:8px 18px; padding-top:4px; }
    .hero-assurances span { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--color-text-muted); }
    .hero-assurances mat-icon { font-size:16px; width:16px; height:16px; color:var(--color-success); }
    .cover-panel { position:relative; display:flex; flex-direction:column; gap:10px; padding:22px; border-radius:20px; background:color-mix(in srgb, var(--color-ink) 76%, transparent); border:1px solid var(--color-border); backdrop-filter:blur(8px); }
    .cover-title-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .cover-title-row h2, .cover-empty-title { margin:0; font-size:26px; letter-spacing:-.03em; }
    .cover-copy { margin:0; font-size:13px; line-height:1.6; color:var(--color-text-muted); }
    .cover-facts { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:4px 0 8px; }
    .cover-facts div { padding:9px 11px; border-radius:10px; background:var(--color-surface); }
    .cover-facts dt { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--color-text-muted); }
    .cover-facts dd { margin:2px 0 0; font-size:13px; font-weight:700; }
    .cover-panel a { align-self:flex-start; }
    .cover-empty-line { display:inline-flex; align-items:center; gap:6px; margin-top:4px; font-size:12px; font-weight:600; color:var(--color-accent-text); }
    .cover-empty-line mat-icon { font-size:16px; width:16px; height:16px; }
    .plans-head { margin:4px 0 -4px; }
    .plans-head h2 { margin:4px 0 0; font-size:clamp(24px, 2.3vw, 32px); letter-spacing:-.035em; }
    .plan-grid { display:grid; grid-template-columns:1fr; gap:16px; align-items:stretch; }
    .plan-card { position:relative; display:flex; flex-direction:column; gap:12px; padding:20px; border-radius:22px; background:var(--color-surface-raised); border:1px solid var(--color-border); }
    .plan-featured { border-color:color-mix(in srgb, var(--color-accent-fill) 50%, transparent); box-shadow:0 20px 44px -28px color-mix(in srgb, var(--color-accent-fill) 55%, transparent); }
    .popular-badge { position:absolute; top:-11px; inset-inline-start:22px; padding:4px 10px; border-radius:999px; background:var(--gradient-brandWarm); color:var(--color-on-accent); font-size:9px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    .plan-head { display:flex; align-items:center; gap:12px; }
    .plan-icon { width:44px; height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; flex:none; background:var(--color-accent-soft); color:var(--color-accent-text); }
    .plan-icon mat-icon { font-size:22px; width:22px; height:22px; }
    .plan-icon.tier-basic { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .plan-icon.tier-standard { background:color-mix(in srgb, var(--color-success) 14%, transparent); color:var(--color-success); }
    .plan-icon.tier-elite { background:color-mix(in srgb, var(--color-warning) 14%, transparent); color:var(--color-warning); }
    .plan-tier { font-size:9px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--color-text-muted); }
    .plan-head h3 { margin:2px 0 0; font-size:22px; letter-spacing:-.03em; }
    .plan-description { margin:0; font-size:13px; line-height:1.6; color:var(--color-text-muted); min-height:42px; }
    .plan-price { display:flex; align-items:baseline; gap:6px; }
    .price-value { font-size:36px; font-weight:800; letter-spacing:-.045em; line-height:1; }
    .price-period { font-size:12px; color:var(--color-text-muted); font-weight:600; }
    .price-detail { margin-top:-9px; font-size:11px; color:var(--color-text-muted); }
    .feature-list { list-style:none; display:flex; flex-direction:column; gap:9px; margin:2px 0 0; padding:14px 0 0; border-top:1px solid var(--color-border); flex:1; }
    .feature-list li { display:flex; align-items:flex-start; gap:8px; font-size:12.5px; line-height:1.45; }
    .feature-list mat-icon { font-size:15px; width:15px; height:15px; margin-top:1px; color:var(--color-success); flex:none; }
    .plan-foot { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
    .plan-foot a, .plan-foot button { width:100%; }
    .plan-foot-note { font-size:10.5px; line-height:1.4; color:var(--color-text-muted); text-align:center; }
    .value-band { display:grid; grid-template-columns:1fr; gap:12px; padding:20px; border-radius:20px; background:var(--color-surface); border:1px solid var(--color-border); }
    .value-item { display:flex; gap:11px; align-items:flex-start; padding:4px; }
    .value-icon { width:38px; height:38px; border-radius:11px; display:inline-flex; align-items:center; justify-content:center; background:var(--color-accent-soft); color:var(--color-accent-text); flex:none; }
    .value-icon mat-icon { font-size:19px; width:19px; height:19px; }
    .value-item strong { display:block; font-size:13px; }
    .value-item p { margin:3px 0 0; font-size:11.5px; line-height:1.5; color:var(--color-text-muted); }
    @media (min-width: 760px) {
      .plan-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .value-band { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .catalogue-hero { grid-template-columns:1.35fr .65fr; padding:28px 32px; align-items:center; }
    }
  `],
})
export class PlanCatalogueComponent implements OnInit {
  /** Facade that owns plan, current-cover and action state. */
  readonly facade = inject(MembershipsFacade);
  private readonly router = inject(Router);

  /** Loads plans and current cover. */
  ngOnInit(): void {
    void this.facade.loadCatalogue();
  }

  /**
   * Starts a plan and opens the new subscription.
   *
   * @param plan - Plan chosen from the catalogue.
   */
  async start(plan: MembershipPlan): Promise<void> {
    const id = await this.facade.start(plan.id, true);
    if (id) await this.router.navigate(['/memberships', id]);
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
   * Returns the billing suffix for a plan.
   *
   * @param period - Billing period.
   * @returns Human-readable cadence.
   */
  periodLabel(period: MembershipPlan['billingPeriod']): string {
    return BILLING_PERIOD_LABELS[period];
  }

  /**
   * Returns a short tier description.
   *
   * @param tier - Membership tier.
   * @returns Tier positioning copy.
   */
  tierLabel(tier: MembershipPlan['tier']): string {
    return TIER_LABELS[tier];
  }

  /**
   * Returns an icon for a tier.
   *
   * @param tier - Membership tier.
   * @returns Material icon name.
   */
  tierIcon(tier: MembershipPlan['tier']): string {
    return tier === 'Elite'
      ? 'workspace_premium'
      : tier === 'Premium'
        ? 'bolt'
        : tier === 'Standard'
          ? 'fitness_center'
          : 'spa';
  }
}
