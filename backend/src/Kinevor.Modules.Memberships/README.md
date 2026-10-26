# Kinevor.Modules.Memberships

Membership catalogue and subscription lifecycle module for Kinevor. It owns plans, member
subscriptions, freezes, renewals and cancellations, and exposes authenticated staff and
self-service HTTP endpoints through the platform conventions.

## Registration

```csharp
builder.Services.AddMembershipsModule();
```

The host supplies `ICurrentUser`, `IBranchContext`, persistence and the membership gateway
registration from `Kinevor.Modules.Memberships.EntityFrameworkCore`.

## Lifecycle

- A subscription snapshots its plan name, tier, price, billing period and features at start.
- Freezes pause access and extend the end date by the time actually frozen when resumed.
- Renewals extend from the current end date, or from today when the subscription has expired.
- Cancellations are terminal; cancelled subscriptions cannot be renewed or resumed.
