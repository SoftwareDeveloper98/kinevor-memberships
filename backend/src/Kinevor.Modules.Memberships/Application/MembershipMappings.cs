using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Domain;

namespace Kinevor.Modules.Memberships.Application;

internal static class MembershipMappings
{
    internal static MembershipPlanDto ToDto(this MembershipPlan plan) => new(
        plan.Id,
        plan.Name,
        plan.Description,
        plan.Tier,
        plan.BillingPeriod,
        plan.DurationDays,
        plan.Price,
        plan.Currency,
        plan.Features.ToArray(),
        plan.IsActive,
        plan.CreatedAt,
        plan.UpdatedAt);

    internal static MembershipSummaryDto ToSummary(this Membership membership, DateTime now) => new(
        membership.Id,
        membership.MemberId,
        membership.PlanId,
        membership.PlanName,
        membership.Tier,
        membership.BillingPeriod,
        membership.Price,
        membership.Currency,
        membership.StartDate,
        membership.EndDate,
        membership.EffectiveStatus(now),
        membership.DaysRemaining(now),
        membership.AutoRenew,
        membership.FrozenUntil);

    internal static MembershipDetailDto ToDetail(this Membership membership, DateTime now) => new(
        membership.Id,
        membership.MemberId,
        membership.PlanId,
        membership.PlanName,
        membership.Tier,
        membership.BillingPeriod,
        membership.DurationDays,
        membership.Price,
        membership.Currency,
        membership.Features.ToArray(),
        membership.StartDate,
        membership.EndDate,
        membership.EffectiveStatus(now),
        membership.DaysRemaining(now),
        membership.AutoRenew,
        membership.Notes,
        membership.FrozenFrom,
        membership.FrozenUntil,
        membership.FreezeReason,
        membership.CreatedAt,
        membership.UpdatedAt,
        membership.RowVersion);
}
