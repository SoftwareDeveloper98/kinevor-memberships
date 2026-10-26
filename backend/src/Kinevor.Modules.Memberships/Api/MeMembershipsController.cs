using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Application.Memberships;
using Kinevor.Platform.Api;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kinevor.Modules.Memberships.Api;

/// <summary>Self-service membership endpoints for the authenticated member.</summary>
[ApiController, Route("api/v1/me/memberships"), Authorize(Policy = Policies.MemberOrAbove)]
public class MeMembershipsController(ISender sender, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Lists every subscription owned by the authenticated member.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MembershipSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MembershipSummaryDto>>>> GetAll(
        CancellationToken ct)
    {
        var result = await sender.Send(new GetMembershipsForMemberQuery(MemberId), ct);
        return Ok(ApiResponse<IReadOnlyList<MembershipSummaryDto>>.Ok(result));
    }

    /// <summary>Returns the authenticated member's current subscription, if any.</summary>
    [HttpGet("current")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto?>>> Current(CancellationToken ct)
    {
        var result = await sender.Send(new GetCurrentMembershipQuery(MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto?>.Ok(result));
    }

    /// <summary>Returns one of the authenticated member's subscriptions.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> GetById(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMembershipByIdQuery(id, MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result));
    }

    /// <summary>Starts a subscription for the authenticated member.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MembershipCreatedDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<MembershipCreatedDto>>> Start(
        [FromBody] StartMyMembershipRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new StartMembershipCommand(
            MemberId,
            request.PlanId,
            request.StartDate,
            request.AutoRenew,
            null), ct);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            ApiResponse<MembershipCreatedDto>.Ok(new MembershipCreatedDto(id), "Membership started."));
    }

    /// <summary>Freezes one of the authenticated member's subscriptions.</summary>
    [HttpPost("{id:guid}/freeze")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Freeze(
        Guid id, [FromBody] FreezeMembershipRequest request, CancellationToken ct)
    {
        var result = await sender.Send(
            new FreezeMembershipCommand(id, request.Until, request.Reason, MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership frozen."));
    }

    /// <summary>Resumes one of the authenticated member's frozen subscriptions.</summary>
    [HttpPost("{id:guid}/resume")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Resume(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new ResumeMembershipCommand(id, MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership resumed."));
    }

    /// <summary>Cancels one of the authenticated member's subscriptions.</summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Cancel(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new CancelMembershipCommand(id, MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership cancelled."));
    }

    /// <summary>Renews one of the authenticated member's subscriptions.</summary>
    [HttpPost("{id:guid}/renew")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Renew(
        Guid id,
        [FromBody] RenewMembershipRequest? request,
        CancellationToken ct)
    {
        var result = await sender.Send(
            new RenewMembershipCommand(id, request?.Periods ?? 1, MemberId), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership renewed."));
    }

    private Guid MemberId =>
        currentUser.MemberId ?? throw new ForbiddenException("No linked member profile.");
}

/// <summary>Self-service subscription start request body.</summary>
public record StartMyMembershipRequest(
    Guid PlanId,
    DateTime? StartDate,
    bool AutoRenew);
