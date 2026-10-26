import 'package:kinevor_memberships/kinevor_memberships.dart';

class FakeMembershipsRepository implements MembershipsRepository {
  FakeMembershipsRepository({this.failure}) {
    _all.addAll([_current, ...sampleHistory]);
  }

  final Object? failure;
  int plansCalls = 0;
  int currentCalls = 0;
  int listCalls = 0;
  int detailCalls = 0;
  int startCalls = 0;
  int freezeCalls = 0;
  int resumeCalls = 0;
  int cancelCalls = 0;
  int renewCalls = 0;
  String? lastPlanId;
  String? lastMembershipId;
  DateTime? lastUntil;
  String? lastReason;
  int? lastPeriods;

  MembershipDetail _current = sampleCurrent;
  final List<MembershipDetail> _all = [];

  MembershipDetail get currentMembership => _current;

  void _check() {
    if (failure != null) throw failure!;
  }

  @override
  Future<List<MembershipPlan>> getPlans() async {
    plansCalls++;
    _check();
    return samplePlans;
  }

  @override
  Future<List<MembershipSummary>> getMyMemberships() async {
    listCalls++;
    _check();
    return [..._all];
  }

  @override
  Future<MembershipDetail?> getCurrentMembership() async {
    currentCalls++;
    _check();
    return _current;
  }

  @override
  Future<MembershipDetail> getMembership(String id) async {
    detailCalls++;
    _check();
    return _all.firstWhere(
      (membership) => membership.id == id,
      orElse: () => _current,
    );
  }

  @override
  Future<MembershipCreated> startMembership(
    String planId, {
    bool autoRenew = true,
  }) async {
    startCalls++;
    _check();
    lastPlanId = planId;
    final plan = samplePlans.firstWhere((plan) => plan.id == planId);
    final created = _fromPlan(plan, autoRenew: autoRenew);
    _current = created;
    _all.insert(0, created);
    return MembershipCreated(id: created.id);
  }

  @override
  Future<MembershipDetail> freezeMembership(
    String id, {
    required DateTime until,
    String? reason,
  }) async {
    freezeCalls++;
    _check();
    lastMembershipId = id;
    lastUntil = until;
    lastReason = reason;
    final updated = _replace(
      id,
      (membership) => membership.copyWith(
        status: 'Frozen',
        frozenFrom: DateTime(2026, 10, 21),
        frozenUntil: until,
        freezeReason: reason,
      ),
    );
    return updated;
  }

  @override
  Future<MembershipDetail> resumeMembership(String id) async {
    resumeCalls++;
    _check();
    lastMembershipId = id;
    return _replace(
      id,
      (membership) => membership.copyWith(status: 'Active', clearFrozen: true),
    );
  }

  @override
  Future<MembershipDetail> cancelMembership(String id) async {
    cancelCalls++;
    _check();
    lastMembershipId = id;
    final updated = _replace(
      id,
      (membership) => membership.copyWith(
        status: 'Cancelled',
        autoRenew: false,
        daysRemaining: 0,
        clearFrozen: true,
      ),
    );
    if (_current.id == id) _current = updated;
    return updated;
  }

  @override
  Future<MembershipDetail> renewMembership(String id, {int periods = 1}) async {
    renewCalls++;
    _check();
    lastMembershipId = id;
    lastPeriods = periods;
    return _replace(
      id,
      (membership) => membership.copyWith(
        endDate: membership.endDate.add(
          Duration(days: membership.durationDays * periods),
        ),
        daysRemaining:
            membership.daysRemaining + membership.durationDays * periods,
        status: 'Active',
      ),
    );
  }

  MembershipDetail _replace(
    String id,
    MembershipDetail Function(MembershipDetail) update,
  ) {
    final index = _all.indexWhere((membership) => membership.id == id);
    if (index < 0) return _current;
    final updated = update(_all[index]);
    _all[index] = updated;
    if (_current.id == id) _current = updated;
    return updated;
  }

  MembershipDetail _fromPlan(MembershipPlan plan, {required bool autoRenew}) {
    final start = DateTime(2026, 10, 21);
    return MembershipDetail(
      id: 'membership-new',
      memberId: sampleCurrent.memberId,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      billingPeriod: plan.billingPeriod,
      durationDays: plan.durationDays,
      price: plan.price,
      currency: plan.currency,
      features: plan.features,
      startDate: start,
      endDate: start.add(Duration(days: plan.durationDays - 1)),
      status: 'Active',
      daysRemaining: plan.durationDays - 1,
      autoRenew: autoRenew,
      createdAt: start,
      rowVersion: 'new',
    );
  }
}

extension on MembershipDetail {
  MembershipDetail copyWith({
    String? status,
    bool? autoRenew,
    int? daysRemaining,
    DateTime? endDate,
    DateTime? frozenFrom,
    DateTime? frozenUntil,
    String? freezeReason,
    bool clearFrozen = false,
  }) {
    return MembershipDetail(
      id: id,
      memberId: memberId,
      planId: planId,
      planName: planName,
      tier: tier,
      billingPeriod: billingPeriod,
      durationDays: durationDays,
      price: price,
      currency: currency,
      features: features,
      startDate: startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      daysRemaining: daysRemaining ?? this.daysRemaining,
      autoRenew: autoRenew ?? this.autoRenew,
      notes: notes,
      frozenFrom: clearFrozen ? null : (frozenFrom ?? this.frozenFrom),
      frozenUntil: clearFrozen ? null : (frozenUntil ?? this.frozenUntil),
      freezeReason: clearFrozen ? null : (freezeReason ?? this.freezeReason),
      createdAt: createdAt,
      updatedAt: updatedAt,
      rowVersion: rowVersion,
    );
  }
}

final samplePlans = [
  MembershipPlan(
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Foundation',
    description:
        'Everything you need for a consistent training habit, with flexible '
        'gym access.',
    tier: 'Basic',
    billingPeriod: 'Monthly',
    durationDays: 30,
    price: 39,
    currency: 'GBP',
    features: const [
      'Unrestricted gym floor access',
      'Locker room and showers',
      'Kinevor app workout library',
      'One guest pass each month',
    ],
    isActive: true,
    createdAt: DateTime(2026, 1, 1),
  ),
  MembershipPlan(
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Performance',
    description:
        'Unlimited classes and recovery support for members training with '
        'intent.',
    tier: 'Premium',
    billingPeriod: 'Quarterly',
    durationDays: 90,
    price: 129,
    currency: 'GBP',
    features: const [
      'Everything in Foundation',
      'Unlimited studio classes',
      'Recovery zone and sauna',
      'Two personal training sessions',
      'Quarterly body composition scan',
    ],
    isActive: true,
    createdAt: DateTime(2026, 1, 1),
  ),
  MembershipPlan(
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Elite',
    description:
        'Our most complete membership with priority booking and concierge '
        'support.',
    tier: 'Elite',
    billingPeriod: 'Annual',
    durationDays: 365,
    price: 1290,
    currency: 'GBP',
    features: const [
      'Everything in Performance',
      'Priority class booking',
      'Monthly sports massage',
      'Unlimited guest passes',
      'Dedicated membership concierge',
      'Partner club access',
    ],
    isActive: true,
    createdAt: DateTime(2026, 1, 1),
  ),
];

final sampleCurrent = MembershipDetail(
  id: '40000000-0000-0000-0000-000000000001',
  memberId: '11111111-1111-1111-1111-111111111111',
  planId: samplePlans[1].id,
  planName: 'Performance',
  tier: 'Premium',
  billingPeriod: 'Quarterly',
  durationDays: 90,
  price: 129,
  currency: 'GBP',
  features: samplePlans[1].features,
  startDate: DateTime(2026, 9, 12),
  endDate: DateTime(2026, 12, 11),
  status: 'Active',
  daysRemaining: 51,
  autoRenew: true,
  createdAt: DateTime(2026, 9, 12),
  rowVersion: 'rev-1',
);

final sampleHistory = [
  MembershipDetail(
    id: '40000000-0000-0000-0000-000000000002',
    memberId: sampleCurrent.memberId,
    planId: samplePlans[0].id,
    planName: 'Foundation',
    tier: 'Basic',
    billingPeriod: 'Monthly',
    durationDays: 30,
    price: 39,
    currency: 'GBP',
    features: samplePlans[0].features,
    startDate: DateTime(2025, 11, 25),
    endDate: DateTime(2025, 12, 25),
    status: 'Cancelled',
    daysRemaining: 0,
    autoRenew: false,
    createdAt: DateTime(2025, 11, 25),
    rowVersion: 'rev-2',
  ),
];
