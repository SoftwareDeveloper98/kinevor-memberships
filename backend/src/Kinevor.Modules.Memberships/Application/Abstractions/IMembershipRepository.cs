using Kinevor.Modules.Memberships.Domain;

namespace Kinevor.Modules.Memberships.Application.Abstractions;

/// <summary>Persistence operations for member subscriptions.</summary>
public interface IMembershipRepository
{
    /// <summary>Finds a subscription by identifier.</summary>
    Task<Membership?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Lists every subscription owned by a member, newest first.</summary>
    Task<IReadOnlyList<Membership>> ListForMemberAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>Finds the current active or frozen subscription for a member.</summary>
    Task<Membership?> GetCurrentAsync(Guid memberId, DateTime now, CancellationToken ct = default);

    /// <summary>Searches subscriptions with optional member and status filters.</summary>
    Task<(IReadOnlyList<Membership> Items, int TotalCount)> SearchAsync(
        Guid? memberId,
        MembershipStatus? status,
        int page,
        int pageSize,
        DateTime now,
        CancellationToken ct = default);

    /// <summary>Checks whether a member already has a non-cancelled subscription covering a period.</summary>
    Task<bool> HasOverlapAsync(
        Guid memberId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken ct = default);

    /// <summary>Stages a new subscription for insertion.</summary>
    void Add(Membership membership);
}
