import '../models/membership.dart';
import 'kinevor_memberships_client.dart';

/// Data source for the membership self-service screens.
abstract interface class MembershipsRepository {
  /// Loads the active plan catalogue.
  Future<List<MembershipPlan>> getPlans();

  /// Loads every subscription owned by the authenticated member.
  Future<List<MembershipSummary>> getMyMemberships();

  /// Loads the current subscription, or `null` when none is current.
  Future<MembershipDetail?> getCurrentMembership();

  /// Loads one member-owned subscription.
  Future<MembershipDetail> getMembership(String id);

  /// Starts a subscription on [planId].
  Future<MembershipCreated> startMembership(
    String planId, {
    bool autoRenew = true,
  });

  /// Freezes a subscription through [until], inclusive.
  Future<MembershipDetail> freezeMembership(
    String id, {
    required DateTime until,
    String? reason,
  });

  /// Resumes a frozen subscription.
  Future<MembershipDetail> resumeMembership(String id);

  /// Cancels a subscription immediately.
  Future<MembershipDetail> cancelMembership(String id);

  /// Extends a subscription by whole billing [periods].
  Future<MembershipDetail> renewMembership(String id, {int periods = 1});
}

/// [MembershipsRepository] backed by [KinevorMembershipsClient].
class RemoteMembershipsRepository implements MembershipsRepository {
  /// Creates a repository over [client].
  const RemoteMembershipsRepository(this.client);

  /// HTTP client used for every call.
  final KinevorMembershipsClient client;

  @override
  Future<List<MembershipPlan>> getPlans() => client.fetchPlans();

  @override
  Future<List<MembershipSummary>> getMyMemberships() =>
      client.fetchMyMemberships();

  @override
  Future<MembershipDetail?> getCurrentMembership() =>
      client.fetchCurrentMembership();

  @override
  Future<MembershipDetail> getMembership(String id) =>
      client.fetchMembership(id);

  @override
  Future<MembershipCreated> startMembership(
    String planId, {
    bool autoRenew = true,
  }) => client.startMembership(planId: planId, autoRenew: autoRenew);

  @override
  Future<MembershipDetail> freezeMembership(
    String id, {
    required DateTime until,
    String? reason,
  }) => client.freezeMembership(id, until: until, reason: reason);

  @override
  Future<MembershipDetail> resumeMembership(String id) =>
      client.resumeMembership(id);

  @override
  Future<MembershipDetail> cancelMembership(String id) =>
      client.cancelMembership(id);

  @override
  Future<MembershipDetail> renewMembership(String id, {int periods = 1}) =>
      client.renewMembership(id, periods: periods);
}
