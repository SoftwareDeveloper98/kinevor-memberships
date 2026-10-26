using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Domain;
using Kinevor.Modules.Memberships.EntityFrameworkCore.Configurations;
using Kinevor.Platform.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore;

/// <summary>EF Core context owned by the memberships module.</summary>
/// <param name="options">Provider and connection options supplied by the host.</param>
public sealed class MembershipsDbContext(DbContextOptions<MembershipsDbContext> options)
    : DbContext(options), IMembershipsUnitOfWork
{
    /// <summary>Membership plan catalogue.</summary>
    public DbSet<MembershipPlan> Plans => Set<MembershipPlan>();

    /// <summary>Member subscriptions.</summary>
    public DbSet<Membership> Memberships => Set<Membership>();

    /// <summary>Applies module configurations.</summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.ApplyConfiguration(new MembershipPlanConfiguration());
        modelBuilder.ApplyConfiguration(new MembershipConfiguration());
        base.OnModelCreating(modelBuilder);
    }

    /// <summary>Stamps audit fields and persists pending changes.</summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            if (entry.State == EntityState.Added)
                entry.Property(nameof(Entity.CreatedAt)).CurrentValue = now;

            if (entry.State == EntityState.Modified)
                entry.Property(nameof(Entity.UpdatedAt)).CurrentValue = now;
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Persists pending changes, returning <see langword="false"/> on a concurrency conflict.</summary>
    public async Task<bool> TrySaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }
}
