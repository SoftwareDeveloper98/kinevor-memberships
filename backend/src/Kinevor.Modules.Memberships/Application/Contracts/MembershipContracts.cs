using Kinevor.Modules.Memberships.Domain;

namespace Kinevor.Modules.Memberships.Application.Contracts;

/// <summary>Plan catalogue entry returned by the plans API.</summary>
public record MembershipPlanDto(
    Guid Id,
    string Name,
    string Description,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    int DurationDays,
    decimal Price,
    string Currency,
    IReadOnlyList<string> Features,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

/// <summary>Compact subscription projection used by list endpoints.</summary>
public record MembershipSummaryDto(
    Guid Id,
    Guid MemberId,
    Guid PlanId,
    string PlanName,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    decimal Price,
    string Currency,
    DateTime StartDate,
    DateTime EndDate,
    MembershipStatus Status,
    int DaysRemaining,
    bool AutoRenew,
    DateTime? FrozenUntil);

/// <summary>Full subscription projection including snapshotted benefits and notes.</summary>
public record MembershipDetailDto(
    Guid Id,
    Guid MemberId,
    Guid PlanId,
    string PlanName,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    int DurationDays,
    decimal Price,
    string Currency,
    IReadOnlyList<string> Features,
    DateTime StartDate,
    DateTime EndDate,
    MembershipStatus Status,
    int DaysRemaining,
    bool AutoRenew,
    string? Notes,
    DateTime? FrozenFrom,
    DateTime? FrozenUntil,
    string? FreezeReason,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    Guid RowVersion);

/// <summary>Identifier returned after creating a plan.</summary>
public record MembershipPlanCreatedDto(Guid Id);

/// <summary>Identifier returned after starting a subscription.</summary>
public record MembershipCreatedDto(Guid Id);
