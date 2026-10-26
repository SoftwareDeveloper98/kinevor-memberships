using Kinevor.Modules.Memberships.Domain;

namespace Kinevor.Modules.Memberships.Application.Abstractions;

/// <summary>Persistence operations for the plan catalogue.</summary>
public interface IPlanRepository
{
    /// <summary>Finds a plan by identifier.</summary>
    Task<MembershipPlan?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Lists plans ordered by price, optionally including inactive plans.</summary>
    Task<IReadOnlyList<MembershipPlan>> ListAsync(bool includeInactive, CancellationToken ct = default);

    /// <summary>Stages a new plan for insertion.</summary>
    void Add(MembershipPlan plan);
}
