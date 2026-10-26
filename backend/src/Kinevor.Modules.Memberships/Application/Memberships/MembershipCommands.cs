using Kinevor.Modules.Memberships.Application.Abstractions;
using Kinevor.Modules.Memberships.Application.Contracts;
using Kinevor.Modules.Memberships.Domain;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Memberships.Application.Memberships;

/// <summary>Starts a subscription for an external member.</summary>
/// <param name="MemberId">External member identifier.</param>
/// <param name="PlanId">Plan to subscribe to.</param>
/// <param name="StartDate">Optional first day of cover.</param>
/// <param name="AutoRenew">Whether renewal is intended.</param>
/// <param name="Notes">Optional internal notes.</param>
public record StartMembershipCommand(
    Guid MemberId,
    Guid PlanId,
    DateTime? StartDate,
    bool AutoRenew,
    string? Notes) : IRequest<Guid>;

/// <summary>Freezes an active subscription.</summary>
/// <param name="Id">Subscription identifier.</param>
/// <param name="Until">Last day of the freeze.</param>
/// <param name="Reason">Optional reason for the freeze.</param>
/// <param name="OwnerMemberId">When set, the caller must own the subscription.</param>
public record FreezeMembershipCommand(
    Guid Id,
    DateTime Until,
    string? Reason,
    Guid? OwnerMemberId = null) : IRequest<MembershipDetailDto>;

/// <summary>Resumes a frozen subscription.</summary>
/// <param name="Id">Subscription identifier.</param>
/// <param name="OwnerMemberId">When set, the caller must own the subscription.</param>
public record ResumeMembershipCommand(Guid Id, Guid? OwnerMemberId = null)
    : IRequest<MembershipDetailDto>;

/// <summary>Cancels a subscription permanently.</summary>
/// <param name="Id">Subscription identifier.</param>
/// <param name="OwnerMemberId">When set, the caller must own the subscription.</param>
public record CancelMembershipCommand(Guid Id, Guid? OwnerMemberId = null)
    : IRequest<MembershipDetailDto>;

/// <summary>Extends a subscription by whole billing periods.</summary>
/// <param name="Id">Subscription identifier.</param>
/// <param name="Periods">Number of billing periods, between one and twelve.</param>
/// <param name="OwnerMemberId">When set, the caller must own the subscription.</param>
public record RenewMembershipCommand(Guid Id, int Periods, Guid? OwnerMemberId = null)
    : IRequest<MembershipDetailDto>;

/// <summary>Handles subscription starts.</summary>
public sealed class StartMembershipHandler(
    IPlanRepository plans,
    IMembershipRepository memberships,
    IMembershipsUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<StartMembershipCommand, Guid>
{
    /// <summary>Snapshots the plan, rejects overlapping cover and persists the subscription.</summary>
    public async Task<Guid> Handle(StartMembershipCommand request, CancellationToken cancellationToken)
    {
        var plan = await plans.GetByIdAsync(request.PlanId, cancellationToken)
            ?? throw new NotFoundException("Membership plan", request.PlanId);

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var membership = Membership.Create(
            request.MemberId,
            plan,
            request.StartDate,
            request.AutoRenew,
            request.Notes,
            now);

        if (await memberships.HasOverlapAsync(
                request.MemberId, membership.StartDate, membership.EndDate, cancellationToken))
        {
            throw new ConflictException("The member already has a membership covering this period.");
        }

        memberships.Add(membership);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return membership.Id;
    }
}

/// <summary>Handles subscription freezes.</summary>
public sealed class FreezeMembershipHandler(
    IMembershipRepository memberships,
    IMembershipsUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<FreezeMembershipCommand, MembershipDetailDto>
{
    /// <summary>Applies the freeze and returns the updated subscription.</summary>
    public async Task<MembershipDetailDto> Handle(
        FreezeMembershipCommand request, CancellationToken cancellationToken)
    {
        var membership = await MembershipAccess.GetAsync(
            memberships, request.Id, request.OwnerMemberId, cancellationToken);

        var now = timeProvider.GetUtcNow().UtcDateTime;
        membership.Freeze(request.Until, request.Reason, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return membership.ToDetail(now);
    }
}

/// <summary>Handles subscription resumes.</summary>
public sealed class ResumeMembershipHandler(
    IMembershipRepository memberships,
    IMembershipsUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<ResumeMembershipCommand, MembershipDetailDto>
{
    /// <summary>Resumes the freeze, extends cover and returns the updated subscription.</summary>
    public async Task<MembershipDetailDto> Handle(
        ResumeMembershipCommand request, CancellationToken cancellationToken)
    {
        var membership = await MembershipAccess.GetAsync(
            memberships, request.Id, request.OwnerMemberId, cancellationToken);

        var now = timeProvider.GetUtcNow().UtcDateTime;
        membership.Resume(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return membership.ToDetail(now);
    }
}

/// <summary>Handles subscription cancellations.</summary>
public sealed class CancelMembershipHandler(
    IMembershipRepository memberships,
    IMembershipsUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<CancelMembershipCommand, MembershipDetailDto>
{
    /// <summary>Cancels the subscription and returns its final state.</summary>
    public async Task<MembershipDetailDto> Handle(
        CancelMembershipCommand request, CancellationToken cancellationToken)
    {
        var membership = await MembershipAccess.GetAsync(
            memberships, request.Id, request.OwnerMemberId, cancellationToken);

        membership.Cancel();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return membership.ToDetail(timeProvider.GetUtcNow().UtcDateTime);
    }
}

/// <summary>Handles subscription renewals.</summary>
public sealed class RenewMembershipHandler(
    IMembershipRepository memberships,
    IMembershipsUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<RenewMembershipCommand, MembershipDetailDto>
{
    /// <summary>Extends the subscription and returns the updated end date.</summary>
    public async Task<MembershipDetailDto> Handle(
        RenewMembershipCommand request, CancellationToken cancellationToken)
    {
        var membership = await MembershipAccess.GetAsync(
            memberships, request.Id, request.OwnerMemberId, cancellationToken);

        var now = timeProvider.GetUtcNow().UtcDateTime;
        membership.Renew(request.Periods, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return membership.ToDetail(now);
    }
}
