using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Domain;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Memberships.Application.Memberships;

/// <summary>Lists subscriptions for staff administration.</summary>
/// <param name="MemberId">Optional external member identifier.</param>
/// <param name="Status">Optional case-insensitive status filter.</param>
/// <param name="Page">One-based page number.</param>
/// <param name="PageSize">Page size between one and one hundred.</param>
public record GetMembershipsQuery(
    Guid? MemberId,
    string? Status,
    int Page,
    int PageSize) : IRequest<PagedResult<MembershipSummaryDto>>;

/// <summary>Lists every subscription owned by one member.</summary>
/// <param name="MemberId">External member identifier.</param>
public record GetMembershipsForMemberQuery(Guid MemberId)
    : IRequest<IReadOnlyList<MembershipSummaryDto>>;

/// <summary>Finds a member's current subscription, if any.</summary>
/// <param name="MemberId">External member identifier.</param>
public record GetCurrentMembershipQuery(Guid MemberId)
    : IRequest<MembershipDetailDto?>;

/// <summary>Finds one subscription, optionally enforcing member ownership.</summary>
/// <param name="Id">Subscription identifier.</param>
/// <param name="OwnerMemberId">When set, the caller must own the subscription.</param>
public record GetMembershipByIdQuery(Guid Id, Guid? OwnerMemberId = null)
    : IRequest<MembershipDetailDto>;

/// <summary>Handles paged staff subscription searches.</summary>
public sealed class GetMembershipsHandler(IMembershipRepository memberships, TimeProvider timeProvider)
    : IRequestHandler<GetMembershipsQuery, PagedResult<MembershipSummaryDto>>
{
    /// <summary>Parses filters, validates paging and projects the requested page.</summary>
    public async Task<PagedResult<MembershipSummaryDto>> Handle(
        GetMembershipsQuery request, CancellationToken cancellationToken)
    {
        if (request.Page < 1)
            throw new DomainException("Page must be at least one.");

        if (request.PageSize is < 1 or > 100)
            throw new DomainException("Page size must be between one and one hundred.");

        var status = ParseStatus(request.Status);
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var (items, total) = await memberships.SearchAsync(
            request.MemberId, status, request.Page, request.PageSize, now, cancellationToken);

        return new PagedResult<MembershipSummaryDto>(
            items.Select(membership => membership.ToSummary(now)).ToArray(),
            total,
            request.Page,
            request.PageSize);
    }

    private static MembershipStatus? ParseStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (!Enum.TryParse<MembershipStatus>(value, true, out var status) || !Enum.IsDefined(status))
            throw new DomainException("Status must be Active, Frozen, Cancelled or Expired.");

        return status;
    }
}

/// <summary>Handles member-owned subscription lists.</summary>
public sealed class GetMembershipsForMemberHandler(
    IMembershipRepository memberships,
    TimeProvider timeProvider)
    : IRequestHandler<GetMembershipsForMemberQuery, IReadOnlyList<MembershipSummaryDto>>
{
    /// <summary>Returns every subscription owned by the member, newest first.</summary>
    public async Task<IReadOnlyList<MembershipSummaryDto>> Handle(
        GetMembershipsForMemberQuery request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var result = await memberships.ListForMemberAsync(request.MemberId, cancellationToken);
        return result.Select(membership => membership.ToSummary(now)).ToArray();
    }
}

/// <summary>Handles current-subscription reads.</summary>
public sealed class GetCurrentMembershipHandler(
    IMembershipRepository memberships,
    TimeProvider timeProvider)
    : IRequestHandler<GetCurrentMembershipQuery, MembershipDetailDto?>
{
    /// <summary>Returns the current subscription or <see langword="null"/> when none is active.</summary>
    public async Task<MembershipDetailDto?> Handle(
        GetCurrentMembershipQuery request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var membership = await memberships.GetCurrentAsync(request.MemberId, now, cancellationToken);
        return membership?.ToDetail(now);
    }
}

/// <summary>Handles single-subscription reads with optional ownership checks.</summary>
public sealed class GetMembershipByIdHandler(
    IMembershipRepository memberships,
    TimeProvider timeProvider)
    : IRequestHandler<GetMembershipByIdQuery, MembershipDetailDto>
{
    /// <summary>Returns the subscription or hides it from an unrelated member.</summary>
    public async Task<MembershipDetailDto> Handle(
        GetMembershipByIdQuery request, CancellationToken cancellationToken)
    {
        var membership = await MembershipAccess.GetAsync(
            memberships, request.Id, request.OwnerMemberId, cancellationToken);

        return membership.ToDetail(timeProvider.GetUtcNow().UtcDateTime);
    }
}

internal static class MembershipAccess
{
    internal static async Task<Membership> GetAsync(
        IMembershipRepository memberships,
        Guid id,
        Guid? ownerMemberId,
        CancellationToken cancellationToken)
    {
        var membership = await memberships.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Membership", id);

        if (ownerMemberId.HasValue && membership.MemberId != ownerMemberId.Value)
            throw new NotFoundException("Membership", id);

        return membership;
    }
}
