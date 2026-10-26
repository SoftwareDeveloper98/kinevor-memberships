using Kinevor.Platform.Application.Exceptions;
using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Memberships.Domain;

/// <summary>A member's subscription to a membership plan.</summary>
public sealed class Membership : AggregateRoot
{
    private readonly List<string> _features = [];

    private Membership()
    {
    }

    /// <summary>External member identifier supplied by the host application.</summary>
    public Guid MemberId { get; private set; }

    /// <summary>Identifier of the plan the subscription started on.</summary>
    public Guid PlanId { get; private set; }

    /// <summary>Plan name captured when the subscription started.</summary>
    public string PlanName { get; private set; } = string.Empty;

    /// <summary>Tier captured when the subscription started.</summary>
    public MembershipTier Tier { get; private set; }

    /// <summary>Price captured when the subscription started.</summary>
    public decimal Price { get; private set; }

    /// <summary>ISO 4217 currency code captured when the subscription started.</summary>
    public string Currency { get; private set; } = string.Empty;

    /// <summary>Billing period captured when the subscription started.</summary>
    public BillingPeriod BillingPeriod { get; private set; }

    /// <summary>Benefits captured when the subscription started.</summary>
    public IReadOnlyList<string> Features => _features.AsReadOnly();

    /// <summary>Inclusive first date of cover.</summary>
    public DateTime StartDate { get; private set; }

    /// <summary>Inclusive last date of cover.</summary>
    public DateTime EndDate { get; private set; }

    /// <summary>Persisted lifecycle state.</summary>
    public MembershipStatus Status { get; private set; }

    /// <summary>Whether the subscription is intended to renew automatically.</summary>
    public bool AutoRenew { get; private set; }

    /// <summary>Optional internal notes captured at start.</summary>
    public string? Notes { get; private set; }

    /// <summary>First frozen date, while a freeze is recorded.</summary>
    public DateTime? FrozenFrom { get; private set; }

    /// <summary>Planned last frozen date, while a freeze is recorded.</summary>
    public DateTime? FrozenUntil { get; private set; }

    /// <summary>Reason supplied for the current or most recent freeze.</summary>
    public string? FreezeReason { get; private set; }

    /// <summary>Optimistic-concurrency token changed by every lifecycle transition.</summary>
    public Guid RowVersion { get; private set; } = Guid.NewGuid();

    /// <summary>Number of days covered by one renewal period of the captured plan.</summary>
    public int DurationDays => BillingPeriods.ToDays(BillingPeriod);

    /// <summary>Creates a subscription from an active plan and snapshots its commercial terms.</summary>
    /// <param name="memberId">External member identifier.</param>
    /// <param name="plan">Active plan to subscribe to.</param>
    /// <param name="startDate">Optional first day of cover; defaults to today.</param>
    /// <param name="autoRenew">Whether renewal is intended.</param>
    /// <param name="notes">Optional internal notes.</param>
    /// <param name="now">Current UTC time supplied by the application layer.</param>
    /// <param name="id">Optional deterministic identifier used by data seeding.</param>
    /// <returns>A new membership aggregate.</returns>
    /// <exception cref="DomainException">The plan is unavailable or a supplied value is invalid.</exception>
    public static Membership Create(
        Guid memberId,
        MembershipPlan plan,
        DateTime? startDate,
        bool autoRenew,
        string? notes,
        DateTime now,
        Guid? id = null)
    {
        ArgumentNullException.ThrowIfNull(plan);

        if (memberId == Guid.Empty)
            throw new DomainException("A member identifier is required.");

        if (!plan.IsActive || plan.IsDeleted)
            throw new DomainException("The selected plan is not available for new memberships.");

        var start = (startDate ?? now).Date;
        if (start < now.Date.AddDays(-365) || start > now.Date.AddDays(90))
            throw new DomainException("Start date must be within 365 days in the past and 90 days in the future.");

        var membership = new Membership
        {
            MemberId = memberId,
            PlanId = plan.Id,
            PlanName = plan.Name,
            Tier = plan.Tier,
            Price = plan.Price,
            Currency = plan.Currency,
            BillingPeriod = plan.BillingPeriod,
            StartDate = start,
            EndDate = start.AddDays(plan.DurationDays),
            Status = MembershipStatus.Active,
            AutoRenew = autoRenew,
            Notes = NormalizeOptional(notes, "Notes", 500),
        };

        if (id.HasValue) membership.Id = id.Value;
        membership._features.AddRange(plan.Features);
        return membership;
    }

    /// <summary>Computes the status to expose at a point in time, including unpaid expiry.</summary>
    /// <param name="now">Current UTC time.</param>
    /// <returns>The persisted status, or <see cref="MembershipStatus.Expired"/> when cover has lapsed.</returns>
    public MembershipStatus EffectiveStatus(DateTime now)
    {
        if (Status != MembershipStatus.Cancelled && now.Date > EndDate.Date)
            return MembershipStatus.Expired;

        return Status;
    }

    /// <summary>Returns whether the membership currently grants access.</summary>
    /// <param name="now">Current UTC time.</param>
    /// <returns><see langword="true"/> for a current active or frozen membership.</returns>
    public bool IsCurrentAt(DateTime now) =>
        EffectiveStatus(now) is MembershipStatus.Active or MembershipStatus.Frozen;

    /// <summary>Returns the remaining whole days of cover, never negative.</summary>
    /// <param name="now">Current UTC time.</param>
    /// <returns>Days until the inclusive end date.</returns>
    public int DaysRemaining(DateTime now) => Math.Max(0, (EndDate.Date - now.Date).Days);

    /// <summary>Freezes an active membership for a bounded period.</summary>
    /// <param name="until">Last day of the freeze.</param>
    /// <param name="reason">Optional reason for the freeze.</param>
    /// <param name="now">Current UTC time.</param>
    /// <exception cref="DomainException">The membership cannot be frozen with the supplied values.</exception>
    public void Freeze(DateTime until, string? reason, DateTime now)
    {
        if (Status != MembershipStatus.Active)
            throw new DomainException("Only active memberships can be frozen.");

        if (EffectiveStatus(now) != MembershipStatus.Active)
            throw new DomainException("An expired membership cannot be frozen.");

        var from = now.Date;
        var cleanUntil = until.Date;
        if (cleanUntil <= from)
            throw new DomainException("Freeze end date must be after today.");

        if (cleanUntil > from.AddDays(90))
            throw new DomainException("A membership cannot be frozen for more than 90 days.");

        FrozenFrom = from;
        FrozenUntil = cleanUntil;
        FreezeReason = NormalizeOptional(reason, "Freeze reason", 240);
        EndDate = EndDate.AddDays((cleanUntil - from).Days);
        Status = MembershipStatus.Frozen;
        Touch();
    }

    /// <summary>Resumes a frozen membership and extends cover by the days actually frozen.</summary>
    /// <param name="now">Current UTC time.</param>
    /// <exception cref="DomainException">The membership is not frozen.</exception>
    public void Resume(DateTime now)
    {
        if (Status != MembershipStatus.Frozen || FrozenFrom is null || FrozenUntil is null)
            throw new DomainException("Only frozen memberships can be resumed.");

        var frozenThrough = now.Date < FrozenUntil.Value.Date ? now.Date : FrozenUntil.Value.Date;
        var unusedDays = Math.Max(0, (FrozenUntil.Value.Date - frozenThrough).Days);
        if (unusedDays > 0)
            EndDate = EndDate.AddDays(-unusedDays);

        Status = MembershipStatus.Active;
        FrozenFrom = null;
        FrozenUntil = null;
        FreezeReason = null;
        Touch();
    }

    /// <summary>Cancels the membership permanently.</summary>
    /// <exception cref="DomainException">The membership is already cancelled.</exception>
    public void Cancel()
    {
        if (Status == MembershipStatus.Cancelled)
            throw new DomainException("The membership is already cancelled.");

        Status = MembershipStatus.Cancelled;
        AutoRenew = false;
        FrozenFrom = null;
        FrozenUntil = null;
        FreezeReason = null;
        Touch();
    }

    /// <summary>Extends the subscription by whole billing periods.</summary>
    /// <param name="periods">Number of periods to add, between one and twelve.</param>
    /// <param name="now">Current UTC time.</param>
    /// <returns>The new inclusive end date.</returns>
    /// <exception cref="DomainException">The membership cannot be renewed.</exception>
    public DateTime Renew(int periods, DateTime now)
    {
        if (Status == MembershipStatus.Cancelled)
            throw new DomainException("A cancelled membership cannot be renewed.");

        if (Status == MembershipStatus.Frozen)
            throw new DomainException("Resume the membership before renewing it.");

        if (periods is < 1 or > 12)
            throw new DomainException("Renewal periods must be between one and twelve.");

        var startFrom = EndDate.Date >= now.Date ? EndDate.Date : now.Date;
        EndDate = startFrom.AddDays(DurationDays * periods);
        Status = MembershipStatus.Active;
        Touch();
        return EndDate;
    }

    private void Touch() => RowVersion = Guid.NewGuid();

    private static string? NormalizeOptional(string? value, string field, int maximum)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var clean = value.Trim();
        if (clean.Length > maximum)
            throw new DomainException($"{field} cannot exceed {maximum} characters.");

        return clean;
    }
}
