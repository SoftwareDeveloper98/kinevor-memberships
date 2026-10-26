using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Application.Memberships;
using Kinevor.Platform.Api;
using Kinevor.Platform.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kinevor.Modules.Memberships.Api;

/// <summary>Staff-facing membership subscription endpoints.</summary>
[ApiController, Route("api/v1/memberships"), Authorize(Policy = Policies.StaffOrAdmin)]
public class MembershipsController(ISender sender) : ControllerBase
{
    /// <summary>Lists subscriptions with optional member and status filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MembershipSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<MembershipSummaryDto>>>> GetAll(
        [FromQuery] Guid? memberId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetMembershipsQuery(memberId, status, page, pageSize), ct);
        return Ok(ApiResponse<PagedResult<MembershipSummaryDto>>.Ok(result));
    }

    /// <summary>Returns a member's current subscription, or null when none is active.</summary>
    [HttpGet("current")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto?>>> Current(
        [FromQuery] Guid memberId, CancellationToken ct)
    {
        var result = await sender.Send(new GetCurrentMembershipQuery(memberId), ct);
        return Ok(ApiResponse<MembershipDetailDto?>.Ok(result));
    }

    /// <summary>Returns a subscription by identifier.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> GetById(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetMembershipByIdQuery(id), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result));
    }

    /// <summary>Starts a subscription for a member.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MembershipCreatedDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<MembershipCreatedDto>>> Start(
        [FromBody] CreateMembershipRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new StartMembershipCommand(
            request.MemberId,
            request.PlanId,
            request.StartDate,
            request.AutoRenew,
            request.Notes), ct);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            ApiResponse<MembershipCreatedDto>.Ok(new MembershipCreatedDto(id), "Membership started."));
    }

    /// <summary>Freezes an active subscription.</summary>
    [HttpPost("{id:guid}/freeze")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Freeze(
        Guid id, [FromBody] FreezeMembershipRequest request, CancellationToken ct)
    {
        var result = await sender.Send(
            new FreezeMembershipCommand(id, request.Until, request.Reason), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership frozen."));
    }

    /// <summary>Resumes a frozen subscription.</summary>
    [HttpPost("{id:guid}/resume")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Resume(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new ResumeMembershipCommand(id), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership resumed."));
    }

    /// <summary>Cancels a subscription permanently.</summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Cancel(
        Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new CancelMembershipCommand(id), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership cancelled."));
    }

    /// <summary>Extends a subscription by one or more billing periods.</summary>
    [HttpPost("{id:guid}/renew")]
    [ProducesResponseType(typeof(ApiResponse<MembershipDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MembershipDetailDto>>> Renew(
        Guid id,
        [FromBody] RenewMembershipRequest? request,
        CancellationToken ct)
    {
        var result = await sender.Send(new RenewMembershipCommand(id, request?.Periods ?? 1), ct);
        return Ok(ApiResponse<MembershipDetailDto>.Ok(result, "Membership renewed."));
    }
}

/// <summary>Subscription start request body.</summary>
public record CreateMembershipRequest(
    Guid MemberId,
    Guid PlanId,
    DateTime? StartDate,
    bool AutoRenew,
    string? Notes);

/// <summary>Freeze request body.</summary>
public record FreezeMembershipRequest(DateTime Until, string? Reason);

/// <summary>Renewal request body.</summary>
public record RenewMembershipRequest(int Periods = 1);
