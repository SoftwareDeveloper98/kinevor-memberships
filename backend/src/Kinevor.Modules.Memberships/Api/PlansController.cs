using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Application.Plans;
using Kinevor.Modules.Memberships.Domain;
using Kinevor.Platform.Api;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kinevor.Modules.Memberships.Api;

/// <summary>Membership plan catalogue and administration endpoints.</summary>
[ApiController, Route("api/v1/plans"), Authorize(Policy = Policies.MemberOrAbove)]
public class PlansController(ISender sender, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Lists plans; inactive plans are staff-only.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MembershipPlanDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MembershipPlanDto>>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        if (includeInactive && !IsStaff)
            throw new ForbiddenException("Only staff can list inactive plans.");

        var result = await sender.Send(new GetPlansQuery(includeInactive), ct);
        return Ok(ApiResponse<IReadOnlyList<MembershipPlanDto>>.Ok(result));
    }

    /// <summary>Returns a plan by identifier.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MembershipPlanDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipPlanDto>>> GetById(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetPlanByIdQuery(id), ct);
        return Ok(ApiResponse<MembershipPlanDto>.Ok(result));
    }

    /// <summary>Creates a plan. Staff and administrators only.</summary>
    [HttpPost, Authorize(Policy = Policies.StaffOrAdmin)]
    [ProducesResponseType(typeof(ApiResponse<MembershipPlanDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<MembershipPlanDto>>> Create(
        [FromBody] CreatePlanRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new CreatePlanCommand(
            request.Name,
            request.Description,
            request.Tier,
            request.BillingPeriod,
            request.Price,
            request.Currency,
            request.Features ?? [],
            request.IsActive), ct);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<MembershipPlanDto>.Ok(result, "Plan created."));
    }

    /// <summary>Updates a plan. Staff and administrators only.</summary>
    [HttpPatch("{id:guid}"), Authorize(Policy = Policies.StaffOrAdmin)]
    [ProducesResponseType(typeof(ApiResponse<MembershipPlanDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipPlanDto>>> Update(
        Guid id, [FromBody] UpdatePlanRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new UpdatePlanCommand(
            id,
            request.Name,
            request.Description,
            request.Tier,
            request.BillingPeriod,
            request.Price,
            request.Currency,
            request.Features ?? [],
            request.IsActive), ct);

        return Ok(ApiResponse<MembershipPlanDto>.Ok(result, "Plan updated."));
    }

    private bool IsStaff => currentUser.Roles.Contains("Staff") || currentUser.Roles.Contains("Admin");
}

/// <summary>Plan creation request body.</summary>
public record CreatePlanRequest(
    string Name,
    string Description,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    decimal Price,
    string Currency,
    IReadOnlyList<string>? Features,
    bool IsActive = true);

/// <summary>Plan update request body.</summary>
public record UpdatePlanRequest(
    string Name,
    string Description,
    MembershipTier Tier,
    BillingPeriod BillingPeriod,
    decimal Price,
    string Currency,
    IReadOnlyList<string>? Features,
    bool IsActive);
