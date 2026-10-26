using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Domain;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore.Repositories;

internal sealed class PlanRepository(MembershipsDbContext db) : IPlanRepository
{
    public Task<MembershipPlan?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Plans.FirstOrDefaultAsync(plan => plan.Id == id, ct);

    public async Task<IReadOnlyList<MembershipPlan>> ListAsync(
        bool includeInactive, CancellationToken ct = default)
    {
        var query = db.Plans.AsNoTracking();
        if (!includeInactive)
            query = query.Where(plan => plan.IsActive);

        var plans = await query.ToListAsync(ct);
        return plans
            .OrderBy(plan => plan.Price)
            .ThenBy(plan => plan.Name)
            .ToArray();
    }

    public void Add(MembershipPlan plan) => db.Plans.Add(plan);
}
