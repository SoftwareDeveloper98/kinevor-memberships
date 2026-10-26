using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.EntityFrameworkCore.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore.DependencyInjection;

/// <summary>Registers membership persistence services.</summary>
public static class MembershipsEntityFrameworkCoreExtensions
{
    /// <summary>Adds repositories and the module unit of work.</summary>
    public static IServiceCollection AddMembershipsEntityFrameworkCore(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<IMembershipRepository, MembershipRepository>();
        services.AddScoped<IMembershipsUnitOfWork>(provider =>
            provider.GetRequiredService<MembershipsDbContext>());
        return services;
    }
}
