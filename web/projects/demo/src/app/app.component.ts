import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const MEMBER_STORAGE_KEY = 'kinevor-memberships-demo-member';

const DEMO_MEMBERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Maya Thompson', note: 'Performance' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Daniel Okafor', note: 'Foundation' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sofia Rossi', note: 'Frozen elite' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Liam Chen', note: 'Expired — start flow' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Amina Yusuf', note: 'Elite annual' },
] as const;

/** Demo shell for the memberships module. */
@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  template: `
    <header class="demo-topbar">
      <a class="demo-brand" routerLink="/memberships" aria-label="Kinevor Memberships home">
        <span class="demo-logo" aria-hidden="true">K</span>
        <span>Kinevor<span class="demo-brand-accent">Memberships</span></span>
      </a>

      <nav class="demo-nav" aria-label="Demo sections">
        <a
          mat-button
          routerLink="/memberships"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon aria-hidden="true">dashboard</mat-icon>
          My membership
        </a>
        <a mat-button routerLink="/memberships/plans" routerLinkActive="active">
          <mat-icon aria-hidden="true">grid_view</mat-icon>
          Plans
        </a>
      </nav>

      <div class="demo-actor">
        <label for="demo-member">Preview as</label>
        <select id="demo-member" [value]="selectedMember" (change)="switchMember($event)">
          @for (member of members; track member.id) {
            <option [value]="member.id">{{ member.name }} — {{ member.note }}</option>
          }
        </select>
      </div>

      <span class="demo-badge">Demo</span>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="demo-footer">
      <span><span class="kx-dot kx-dot-live"></span>Standalone demo · API on port 5084</span>
      <span>Plans, subscriptions and lifecycle controls</span>
    </footer>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; min-height:100vh; }
    .demo-topbar { display:flex; align-items:center; gap:20px; padding:0 28px; height:68px; background:var(--color-surface-raised); border-bottom:1px solid var(--color-border); position:sticky; top:0; z-index:20; }
    .demo-brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--color-text); font-weight:800; font-size:16px; letter-spacing:-.3px; white-space:nowrap; }
    .demo-brand-accent { color:var(--color-accent-text); margin-inline-start:4px; }
    .demo-logo { width:34px; height:34px; border-radius:10px; background:var(--gradient-brandWarm); color:var(--color-on-accent); display:flex; align-items:center; justify-content:center; font-weight:900; }
    .demo-nav { display:flex; gap:4px; margin-inline-start:auto; }
    .demo-nav a.active { color:var(--color-accent-text) !important; }
    .demo-nav mat-icon { margin-inline-end:6px; }
    .demo-actor { display:flex; align-items:center; gap:7px; padding:5px 8px 5px 11px; border-radius:999px; background:var(--color-surface); border:1px solid var(--color-border); }
    .demo-actor label { font-size:9px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--color-text-muted); white-space:nowrap; }
    .demo-actor select { appearance:none; border:none; background:transparent; color:var(--color-text); font:inherit; font-size:11px; font-weight:600; padding:3px 18px 3px 2px; cursor:pointer; width:198px; max-width:198px; background-image:linear-gradient(45deg, transparent 50%, var(--color-text-muted) 50%), linear-gradient(135deg, var(--color-text-muted) 50%, transparent 50%); background-position:calc(100% - 8px) 52%, calc(100% - 4px) 52%; background-size:4px 4px, 4px 4px; background-repeat:no-repeat; }
    .demo-actor select:focus-visible { outline:none; }
    .demo-actor option { background:var(--color-surface-raised); color:var(--color-text); }
    .demo-badge { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--color-accent-text); border:1px solid color-mix(in srgb, var(--color-accent-fill) 55%, transparent); border-radius:20px; padding:4px 10px; }
    main { flex:1; width:100%; }
    .demo-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:16px 28px; border-top:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-muted); font-size:11px; }
    .demo-footer span { display:inline-flex; align-items:center; gap:7px; }
    @media(max-width:1080px) { .demo-actor { display:none; } }
    @media(max-width:720px) { .demo-topbar { padding:0 14px; gap:10px; } .demo-nav a { font-size:0; min-width:0; padding:8px; } .demo-nav mat-icon { margin:0; } .demo-badge { display:none; } .demo-footer { padding:14px; } }
  `],
})
export class AppComponent {
  /** Seed members available in the standalone demo. */
  readonly members = DEMO_MEMBERS;
  /** Member selected for demo API requests. */
  readonly selectedMember = this.readMember();

  /**
   * Switches the demo member and reloads the self-service routes.
   *
   * @param event - Native select change event.
   */
  switchMember(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    localStorage.setItem(MEMBER_STORAGE_KEY, id);
    window.location.assign('/memberships');
  }

  private readMember(): string {
    const stored = localStorage.getItem(MEMBER_STORAGE_KEY);
    return DEMO_MEMBERS.some((member) => member.id === stored)
      ? (stored as string)
      : DEMO_MEMBERS[0].id;
  }
}
