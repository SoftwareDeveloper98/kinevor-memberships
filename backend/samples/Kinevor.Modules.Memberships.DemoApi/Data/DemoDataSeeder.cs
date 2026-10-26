using Kinevor.Modules.Memberships.Domain;
using Kinevor.Modules.Memberships.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Memberships.DemoApi.Data;

/// <summary>Creates a deterministic membership dataset for the standalone demo and tests.</summary>
public static class DemoDataSeeder
{
    /// <summary>External identifier of the primary demo member, Maya Thompson.</summary>
    public static readonly Guid MayaMemberId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>External identifier of Daniel Okafor.</summary>
    public static readonly Guid DanielMemberId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    /// <summary>External identifier of Sofia Rossi.</summary>
    public static readonly Guid SofiaMemberId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    /// <summary>External identifier of Liam Chen.</summary>
    public static readonly Guid LiamMemberId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    /// <summary>External identifier of Amina Yusuf.</summary>
    public static readonly Guid AminaMemberId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    /// <summary>Seeds plans and subscriptions when the database is empty.</summary>
    /// <param name="db">Membership database context.</param>
    /// <param name="ct">Cancellation token.</param>
    public static async Task SeedAsync(MembershipsDbContext db, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(db);

        if (await db.Plans.AnyAsync(ct))
            return;

        var now = DateTime.UtcNow;
        var foundation = MembershipPlan.Create(
            "Foundation",
            "Everything you need for a consistent training habit, with flexible gym access.",
            MembershipTier.Basic,
            BillingPeriod.Monthly,
            39m,
            "GBP",
            [
                "Unrestricted gym floor access",
                "Locker room and showers",
                "Kinevor app workout library",
                "One guest pass each month",
            ],
            id: Guid.Parse("30000000-0000-0000-0000-000000000001"));

        var performance = MembershipPlan.Create(
            "Performance",
            "Unlimited classes and recovery support for members training with intent.",
            MembershipTier.Premium,
            BillingPeriod.Quarterly,
            129m,
            "GBP",
            [
                "Everything in Foundation",
                "Unlimited studio classes",
                "Recovery zone and sauna",
                "Two personal training sessions",
                "Quarterly body composition scan",
            ],
            id: Guid.Parse("30000000-0000-0000-0000-000000000002"));

        var elite = MembershipPlan.Create(
            "Elite",
            "Our most complete membership with priority booking and concierge support.",
            MembershipTier.Elite,
            BillingPeriod.Annual,
            1290m,
            "GBP",
            [
                "Everything in Performance",
                "Priority class booking",
                "Monthly sports massage",
                "Unlimited guest passes",
                "Dedicated membership concierge",
                "Partner club access",
            ],
            id: Guid.Parse("30000000-0000-0000-0000-000000000003"));

        var corporate = MembershipPlan.Create(
            "Corporate",
            "Annual team membership with consolidated billing for partner organisations.",
            MembershipTier.Standard,
            BillingPeriod.Annual,
            990m,
            "GBP",
            [
                "Everything in Foundation",
                "Consolidated company billing",
                "Quarterly wellbeing report",
                "On-site induction sessions",
            ],
            isActive: false,
            id: Guid.Parse("30000000-0000-0000-0000-000000000004"));

        db.Plans.AddRange(foundation, performance, elite, corporate);

        var maya = Membership.Create(
            MayaMemberId,
            performance,
            now.AddDays(-39),
            autoRenew: true,
            notes: "Prefers evening classes and the recovery zone.",
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000001"));

        var mayaHistory = Membership.Create(
            MayaMemberId,
            foundation,
            now.AddDays(-330),
            autoRenew: false,
            notes: "Previous monthly membership.",
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000002"));
        mayaHistory.Cancel();

        var daniel = Membership.Create(
            DanielMemberId,
            foundation,
            now.AddDays(-12),
            autoRenew: true,
            notes: null,
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000003"));

        var sofia = Membership.Create(
            SofiaMemberId,
            elite,
            now.AddDays(-90),
            autoRenew: true,
            notes: "Annual member since last season.",
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000004"));
        sofia.Freeze(now.AddDays(10), "International travel", now);

        var liam = Membership.Create(
            LiamMemberId,
            foundation,
            now.AddDays(-200),
            autoRenew: false,
            notes: null,
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000005"));

        var amina = Membership.Create(
            AminaMemberId,
            elite,
            now.AddDays(-120),
            autoRenew: false,
            notes: "Annual prepaid membership.",
            now,
            Guid.Parse("40000000-0000-0000-0000-000000000006"));

        db.Memberships.AddRange(maya, mayaHistory, daniel, sofia, liam, amina);
        await db.SaveChangesAsync(ct);
    }
}
