/// One purchasable membership plan.
class MembershipPlan {
  /// Creates a plan.
  const MembershipPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.tier,
    required this.billingPeriod,
    required this.durationDays,
    required this.price,
    required this.currency,
    required this.features,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  /// Stable plan identifier.
  final String id;

  /// Display name.
  final String name;

  /// Marketing description.
  final String description;

  /// Tier, for example `Premium` or `Elite`.
  final String tier;

  /// Billing rhythm, for example `Monthly` or `Annual`.
  final String billingPeriod;

  /// Inclusive length of one billing period in days.
  final int durationDays;

  /// Price charged per billing period.
  final double price;

  /// ISO currency code.
  final String currency;

  /// Benefits included in the plan.
  final List<String> features;

  /// Whether the plan can be purchased.
  final bool isActive;

  /// When the plan was created.
  final DateTime createdAt;

  /// When the plan was last updated.
  final DateTime? updatedAt;

  /// Parses a defensive plan payload.
  factory MembershipPlan.fromJson(Map<String, dynamic> json) => MembershipPlan(
    id: json['id']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    description: json['description']?.toString() ?? '',
    tier: json['tier']?.toString() ?? '',
    billingPeriod: json['billingPeriod']?.toString() ?? '',
    durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
    price: (json['price'] as num?)?.toDouble() ?? 0,
    currency: json['currency']?.toString() ?? 'GBP',
    features: _strings(json['features']),
    isActive: json['isActive'] != false,
    createdAt: _date(json['createdAt']),
    updatedAt: _optionalDate(json['updatedAt']),
  );
}

/// Subscription projection used by member lists.
class MembershipSummary {
  /// Creates a subscription summary.
  const MembershipSummary({
    required this.id,
    required this.memberId,
    required this.planId,
    required this.planName,
    required this.tier,
    required this.billingPeriod,
    required this.price,
    required this.currency,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.daysRemaining,
    required this.autoRenew,
    this.frozenUntil,
  });

  /// Stable subscription identifier.
  final String id;

  /// Owning member identifier.
  final String memberId;

  /// Purchased plan identifier.
  final String planId;

  /// Snapshotted plan name.
  final String planName;

  /// Snapshotted tier.
  final String tier;

  /// Snapshotted billing rhythm.
  final String billingPeriod;

  /// Snapshotted recurring price.
  final double price;

  /// ISO currency code.
  final String currency;

  /// First day of cover.
  final DateTime startDate;

  /// Last day of cover.
  final DateTime endDate;

  /// Lifecycle status, for example `Active` or `Frozen`.
  final String status;

  /// Whole days of cover remaining.
  final int daysRemaining;

  /// Whether the subscription renews automatically.
  final bool autoRenew;

  /// Last day of an active freeze, when frozen.
  final DateTime? frozenUntil;

  /// Whether cover is currently active.
  bool get isActive => status.toLowerCase() == 'active';

  /// Whether cover is currently frozen.
  bool get isFrozen => status.toLowerCase() == 'frozen';

  /// Whether the subscription was cancelled.
  bool get isCancelled => status.toLowerCase() == 'cancelled';

  /// Whether cover has expired.
  bool get isExpired => status.toLowerCase() == 'expired';

  /// Fraction of the term elapsed, clamped between zero and one.
  double get termProgress {
    final total = endDate.difference(startDate).inDays;
    if (total <= 0) return 0;
    return ((total - daysRemaining) / total).clamp(0.0, 1.0).toDouble();
  }

  /// Parses a defensive summary payload.
  factory MembershipSummary.fromJson(Map<String, dynamic> json) =>
      MembershipSummary(
        id: json['id']?.toString() ?? '',
        memberId: json['memberId']?.toString() ?? '',
        planId: json['planId']?.toString() ?? '',
        planName: json['planName']?.toString() ?? '',
        tier: json['tier']?.toString() ?? '',
        billingPeriod: json['billingPeriod']?.toString() ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        currency: json['currency']?.toString() ?? 'GBP',
        startDate: _date(json['startDate']),
        endDate: _date(json['endDate']),
        status: json['status']?.toString() ?? 'Active',
        daysRemaining: (json['daysRemaining'] as num?)?.toInt() ?? 0,
        autoRenew: json['autoRenew'] == true,
        frozenUntil: _optionalDate(json['frozenUntil']),
      );
}

/// Full subscription projection with snapshotted benefits and notes.
class MembershipDetail extends MembershipSummary {
  /// Creates a subscription detail.
  const MembershipDetail({
    required super.id,
    required super.memberId,
    required super.planId,
    required super.planName,
    required super.tier,
    required super.billingPeriod,
    required super.price,
    required super.currency,
    required super.startDate,
    required super.endDate,
    required super.status,
    required super.daysRemaining,
    required super.autoRenew,
    required this.durationDays,
    required this.features,
    required this.createdAt,
    required this.rowVersion,
    super.frozenUntil,
    this.notes,
    this.frozenFrom,
    this.freezeReason,
    this.updatedAt,
  });

  /// Inclusive length of one billing period in days.
  final int durationDays;

  /// Benefits snapshotted from the plan at purchase time.
  final List<String> features;

  /// Optional member notes.
  final String? notes;

  /// First day of the current or latest freeze.
  final DateTime? frozenFrom;

  /// Reason recorded for the freeze.
  final String? freezeReason;

  /// When the subscription was created.
  final DateTime createdAt;

  /// When the subscription was last updated.
  final DateTime? updatedAt;

  /// Concurrency token returned by the API.
  final String rowVersion;

  /// Parses a defensive detail payload.
  factory MembershipDetail.fromJson(Map<String, dynamic> json) =>
      MembershipDetail(
        id: json['id']?.toString() ?? '',
        memberId: json['memberId']?.toString() ?? '',
        planId: json['planId']?.toString() ?? '',
        planName: json['planName']?.toString() ?? '',
        tier: json['tier']?.toString() ?? '',
        billingPeriod: json['billingPeriod']?.toString() ?? '',
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
        price: (json['price'] as num?)?.toDouble() ?? 0,
        currency: json['currency']?.toString() ?? 'GBP',
        features: _strings(json['features']),
        startDate: _date(json['startDate']),
        endDate: _date(json['endDate']),
        status: json['status']?.toString() ?? 'Active',
        daysRemaining: (json['daysRemaining'] as num?)?.toInt() ?? 0,
        autoRenew: json['autoRenew'] == true,
        notes: json['notes']?.toString(),
        frozenFrom: _optionalDate(json['frozenFrom']),
        frozenUntil: _optionalDate(json['frozenUntil']),
        freezeReason: json['freezeReason']?.toString(),
        createdAt: _date(json['createdAt']),
        updatedAt: _optionalDate(json['updatedAt']),
        rowVersion: json['rowVersion']?.toString() ?? '',
      );
}

/// Identifier returned after starting a subscription.
class MembershipCreated {
  /// Creates a creation result.
  const MembershipCreated({required this.id});

  /// Identifier of the new subscription.
  final String id;

  /// Parses a defensive creation payload.
  factory MembershipCreated.fromJson(Map<String, dynamic> json) =>
      MembershipCreated(id: json['id']?.toString() ?? '');
}

DateTime _date(Object? value) =>
    DateTime.tryParse(value?.toString() ?? '') ?? DateTime(1970);

DateTime? _optionalDate(Object? value) =>
    DateTime.tryParse(value?.toString() ?? '');

List<String> _strings(Object? value) {
  if (value is! List) return const [];
  return [
    for (final item in value)
      if (item != null && item.toString().isNotEmpty) item.toString(),
  ];
}
