using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Domain;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Memberships.Application.Plans;

/// <summary>Lists plans in price order.</summary>
/// <param name="IncludeInactive">Whether inactive plans should be included for staff management.</param>
public record GetPlansQuery(bool IncludeInactive) : IRequest<IReadOnlyList<MembershipPlanDto>>;

/// <summary>Finds one plan by identifier.</summary>
/// <param name="Id">Plan identifier.</param>
public record GetPlanByIdQuery(Guid Id) : IRequest<MembershipPlanDto>;

/// <summary>Creates a membership plan.</summary>
/// <param name="Name">Plan name.</param>
/// <param name="Description">Marketing description.</param>
/// <param name="Tier">Granted membership tier.</param>
/// <param name="BillingPeriod">Billing frequency.</param>
/// <param name="Price">Price per period.</param>
/// <param name="Currency">ISO 4217 currency code.</param>
/// <param name="Features">Benefit statements.</param>
/// <param name="IsActive">Whether the plan is immediately purchasable.</param>
public record CreatePlanCommand(
    string Name,
    string Description,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    decimal Price,
    string Currency,
    IReadOnlyList<string> Features,
    bool IsActive) : IRequest<MembershipPlanDto>;

/// <summary>Updates a membership plan.</summary>
/// <param name="Id">Plan identifier.</param>
/// <param name="Name">Plan name.</param>
/// <param name="Description">Marketing description.</param>
/// <param name="Tier">Granted membership tier.</param>
/// <param name="BillingPeriod">Billing frequency.</param>
/// <param name="Price">Price per period.</param>
/// <param name="Currency">ISO 4217 currency code.</param>
/// <param name="Features">Benefit statements.</param>
/// <param name="IsActive">Whether the plan is purchasable.</param>
public record UpdatePlanCommand(
    Guid Id,
    string Name,
    string Description,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    decimal Price,
    string Currency,
    IReadOnlyList<string> Features,
    bool IsActive) : IRequest<MembershipPlanDto>;

/// <summary>Handles plan catalogue reads.</summary>
public sealed class GetPlansHandler(IPlanRepository plans)
    : IRequestHandler<GetPlansQuery, IReadOnlyList<MembershipPlanDto>>
{
    /// <summary>Returns plans in ascending price order.</summary>
    public async Task<IReadOnlyList<MembershipPlanDto>> Handle(
        GetPlansQuery request, CancellationToken cancellationToken)
    {
        var result = await plans.ListAsync(request.IncludeInactive, cancellationToken);
        return result.Select(plan => plan.ToDto()).ToArray();
    }
}

/// <summary>Handles single-plan reads.</summary>
public sealed class GetPlanByIdHandler(IPlanRepository plans)
    : IRequestHandler<GetPlanByIdQuery, MembershipPlanDto>
{
    /// <summary>Returns the requested plan or throws when it does not exist.</summary>
    public async Task<MembershipPlanDto> Handle(
        GetPlanByIdQuery request, CancellationToken cancellationToken)
    {
        var plan = await plans.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException("Membership plan", request.Id);

        return plan.ToDto();
    }
}

/// <summary>Handles plan creation.</summary>
public sealed class CreatePlanHandler(IPlanRepository plans, IMembershipsUnitOfWork unitOfWork)
    : IRequestHandler<CreatePlanCommand, MembershipPlanDto>
{
    /// <summary>Validates, stages and persists a new plan.</summary>
    public async Task<MembershipPlanDto> Handle(
        CreatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = MembershipPlan.Create(
            request.Name,
            request.Description,
            request.Tier,
            request.BillingPeriod,
            request.Price,
            request.Currency,
            request.Features,
            request.IsActive);

        plans.Add(plan);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return plan.ToDto();
    }
}

/// <summary>Handles plan updates.</summary>
public sealed class UpdatePlanHandler(IPlanRepository plans, IMembershipsUnitOfWork unitOfWork)
    : IRequestHandler<UpdatePlanCommand, MembershipPlanDto>
{
    /// <summary>Updates an existing plan without altering subscription snapshots.</summary>
    public async Task<MembershipPlanDto> Handle(
        UpdatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await plans.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException("Membership plan", request.Id);

        plan.Update(
            request.Name,
            request.Description,
            request.Tier,
            request.BillingPeriod,
            request.Price,
            request.Currency,
            request.Features,
            request.IsActive);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return plan.ToDto();
    }
}
