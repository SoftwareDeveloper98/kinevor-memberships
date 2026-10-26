using Kinevor.Modules.Memberships.Application.Memberships;
using Microsoft.Extensions.DependencyInjection;

namespace Kinevor.Modules.Memberships.DependencyInjection;

/// <summary>Registers the memberships application services.</summary>
public static class MembershipsModule
{
    /// <summary>Adds MediatR handlers and the system clock.</summary>
    public static IServiceCollection AddMembershipsModule(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddMediatR(configuration =>
            configuration.RegisterServicesFromAssemblyContaining<GetMembershipsHandler>());
        services.AddSingleton(TimeProvider.System);
        return services;
    }
}
