using Kinevor.Modules.Memberships.Domain;
using Kinevor.Platform.Application.Exceptions;

namespace Kinevor.Modules.Memberships.Tests;

/// <summary>Domain rules for plans and subscription lifecycle transitions.</summary>
public sealed class MembershipDomainTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 9, 30, 0, DateTimeKind.Utc);

    [Fact]
    public void Plan_create_normalizes_catalogue_values()
    {
        var plan = Plan(features: [" Unlimited classes ", "unlimited classes", "Recovery zone"], price: 129.999m);

        Assert.Equal("Performance", plan.Name);
        Assert.Equal(2, plan.Features.Count);
        Assert.Equal(130.00m, plan.Price);
        Assert.Equal(90, plan.DurationDays);
        Assert.Equal(BillingPeriod.Quarterly, plan.BillingPeriod);
        Assert.True(plan.IsActive);
    }

    [Theory]
    [InlineData(0, 1, "GBP", 1)]
    [InlineData(10, 1, "GB", 1)]
    [InlineData(10, 1, "GBP", 0)]
    [InlineData(10, 9, "GBP", 1)]
    public void Plan_rejects_invalid_catalogue_values(
        decimal price, int period, string currency, int featureCount)
    {
        var features = Enumerable.Range(1, featureCount).Select(index => $"Feature {index}").ToArray();

        Assert.Throws<DomainException>(() => MembershipPlan.Create(
            "Performance",
            "A plan description.",
            MembershipTier.Premium,
            (BillingPeriod)period,
            price,
            currency,
            features));
    }

    [Fact]
    public void Plan_update_can_deactivate_without_changing_existing_snapshot()
    {
        var plan = Plan();
        var membership = Membership.Create(Guid.NewGuid(), plan, null, true, null, Now);

        plan.Update(
            "Performance Plus",
            "An updated catalogue description.",
            MembershipTier.Elite,
            BillingPeriod.Annual,
            1500m,
            "GBP",
            ["Everything in Performance"],
            false);

        Assert.False(plan.IsActive);
        Assert.Equal("Performance", membership.PlanName);
        Assert.Equal(129m, membership.Price);
        Assert.Equal(90, membership.DurationDays);
    }

    [Fact]
    public void Membership_create_snapshots_plan_and_sets_inclusive_end_date()
    {
        var plan = Plan();
        var memberId = Guid.NewGuid();

        var membership = Membership.Create(memberId, plan, Now.AddDays(-2), true, "  Evening member  ", Now);

        Assert.Equal(memberId, membership.MemberId);
        Assert.Equal(plan.Id, membership.PlanId);
        Assert.Equal(plan.Name, membership.PlanName);
        Assert.Equal(plan.Price, membership.Price);
        Assert.Equal(plan.Features, membership.Features);
        Assert.Equal(Now.Date.AddDays(-2), membership.StartDate);
        Assert.Equal(Now.Date.AddDays(88), membership.EndDate);
        Assert.Equal(MembershipStatus.Active, membership.Status);
        Assert.Equal("Evening member", membership.Notes);
        Assert.True(membership.AutoRenew);
    }

    [Fact]
    public void Membership_rejects_overlapping_start_older_than_validity_window()
    {
        var plan = Plan();

        Assert.Throws<DomainException>(() =>
            Membership.Create(Guid.NewGuid(), plan, Now.AddDays(-366), false, null, Now));

        Assert.Throws<DomainException>(() =>
            Membership.Create(Guid.Empty, plan, null, false, null, Now));
    }

    [Fact]
    public void Freeze_extends_cover_and_resume_removes_unused_days()
    {
        var membership = Membership.Create(Guid.NewGuid(), Plan(), null, false, null, Now);
        var originalEnd = membership.EndDate;

        membership.Freeze(Now.AddDays(10), "  Travel  ", Now);

        Assert.Equal(MembershipStatus.Frozen, membership.Status);
        Assert.Equal(Now.Date, membership.FrozenFrom);
        Assert.Equal(Now.Date.AddDays(10), membership.FrozenUntil);
        Assert.Equal("Travel", membership.FreezeReason);
        Assert.Equal(originalEnd.AddDays(10), membership.EndDate);

        membership.Resume(Now.AddDays(4));

        Assert.Equal(MembershipStatus.Active, membership.Status);
        Assert.Null(membership.FrozenFrom);
        Assert.Null(membership.FrozenUntil);
        Assert.Equal(originalEnd.AddDays(4), membership.EndDate);
    }

    [Fact]
    public void Freeze_rejects_non_active_or_overlong_windows()
    {
        var membership = Membership.Create(Guid.NewGuid(), Plan(), null, false, null, Now);
        membership.Freeze(Now.AddDays(5), null, Now);

        Assert.Throws<DomainException>(() => membership.Freeze(Now.AddDays(10), null, Now));

        var active = Membership.Create(Guid.NewGuid(), Plan(), null, false, null, Now);
        Assert.Throws<DomainException>(() => active.Freeze(Now.AddDays(91), null, Now));
        Assert.Throws<DomainException>(() => active.Freeze(Now, null, Now));
    }

    [Fact]
    public void Renew_extends_from_end_or_today_after_expiry()
    {
        var membership = Membership.Create(Guid.NewGuid(), Plan(), Now.AddDays(-10), false, null, Now);
        var originalEnd = membership.EndDate;

        var renewedEnd = membership.Renew(2, Now.AddDays(2));

        Assert.Equal(originalEnd.AddDays(180), renewedEnd);
        Assert.Equal(renewedEnd, membership.EndDate);

        var expired = Membership.Create(Guid.NewGuid(), Plan(), now: Now, startDate: Now.AddDays(-200),
            autoRenew: false, notes: null);
        Assert.Equal(MembershipStatus.Expired, expired.EffectiveStatus(Now));

        var reactionatedEnd = expired.Renew(1, Now);
        Assert.Equal(Now.Date.AddDays(90), reactionatedEnd);
        Assert.Equal(MembershipStatus.Active, expired.EffectiveStatus(Now));
    }

    [Fact]
    public void Cancel_is_terminal_and_blocks_lifecycle_actions()
    {
        var membership = Membership.Create(Guid.NewGuid(), Plan(), null, true, null, Now);

        membership.Cancel();

        Assert.Equal(MembershipStatus.Cancelled, membership.Status);
        Assert.False(membership.AutoRenew);
        Assert.Throws<DomainException>(() => membership.Cancel());
        Assert.Throws<DomainException>(() => membership.Renew(1, Now));
        Assert.Throws<DomainException>(() => membership.Resume(Now));
    }

    [Fact]
    public void Renew_rejects_invalid_periods_and_frozen_memberships()
    {
        var membership = Membership.Create(Guid.NewGuid(), Plan(), null, false, null, Now);

        Assert.Throws<DomainException>(() => membership.Renew(0, Now));
        Assert.Throws<DomainException>(() => membership.Renew(13, Now));

        membership.Freeze(Now.AddDays(5), null, Now);
        Assert.Throws<DomainException>(() => membership.Renew(1, Now));
    }

    private static MembershipPlan Plan(
        decimal price = 129m,
        IEnumerable<string>? features = null) =>
        MembershipPlan.Create(
            "Performance",
            "A complete training membership description.",
            MembershipTier.Premium,
            BillingPeriod.Quarterly,
            price,
            "GBP",
            features ?? ["Unlimited classes", "Recovery zone"]);
}
