using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Domain;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore.Repositories;

internal sealed class MembershipRepository(MembershipsDbContext db) : IMembershipRepository
{
    public Task<Membership?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Memberships.FirstOrDefaultAsync(membership => membership.Id == id, ct);

    public async Task<IReadOnlyList<Membership>> ListForMemberAsync(
        Guid memberId, CancellationToken ct = default) =>
        await db.Memberships
            .AsNoTracking()
            .Where(membership => membership.MemberId == memberId)
            .OrderByDescending(membership => membership.StartDate)
            .ThenByDescending(membership => membership.CreatedAt)
            .ToListAsync(ct);

    public Task<Membership?> GetCurrentAsync(
        Guid memberId, DateTime now, CancellationToken ct = default) =>
        db.Memberships
            .AsNoTracking()
            .Where(membership =>
                membership.MemberId == memberId
                && (membership.Status == MembershipStatus.Active || membership.Status == MembershipStatus.Frozen)
                && membership.EndDate >= now.Date)
            .OrderByDescending(membership => membership.StartDate)
            .FirstOrDefaultAsync(ct);

    public async Task<(IReadOnlyList<Membership> Items, int TotalCount)> SearchAsync(
        Guid? memberId,
        MembershipStatus? status,
        int page,
        int pageSize,
        DateTime now,
        CancellationToken ct = default)
    {
        var query = db.Memberships.AsNoTracking().AsQueryable();

        if (memberId.HasValue)
            query = query.Where(membership => membership.MemberId == memberId.Value);

        var today = now.Date;
        query = status switch
        {
            MembershipStatus.Active => query.Where(membership =>
                membership.Status == MembershipStatus.Active && membership.EndDate >= today),
            MembershipStatus.Frozen => query.Where(membership =>
                membership.Status == MembershipStatus.Frozen && membership.EndDate >= today),
            MembershipStatus.Cancelled => query.Where(membership =>
                membership.Status == MembershipStatus.Cancelled),
            MembershipStatus.Expired => query.Where(membership =>
                membership.Status != MembershipStatus.Cancelled && membership.EndDate < today),
            _ => query,
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(membership => membership.StartDate)
            .ThenByDescending(membership => membership.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public Task<bool> HasOverlapAsync(
        Guid memberId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken ct = default) =>
        db.Memberships.AnyAsync(
            membership =>
                membership.MemberId == memberId
                && membership.Status != MembershipStatus.Cancelled
                && membership.EndDate >= startDate.Date
                && membership.StartDate <= endDate.Date,
            ct);

    public void Add(Membership membership) => db.Memberships.Add(membership);
}
