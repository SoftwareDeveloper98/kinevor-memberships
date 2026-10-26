import 'package:flutter/material.dart';

import '../data/memberships_api_exception.dart';
import '../data/memberships_repository.dart';
import '../models/membership.dart';
import '../theme/kinevor_memberships_theme.dart';
import '../theme/memberships_strings.dart';
import 'membership_plans_screen.dart';
import 'membership_shared.dart';

/// Full membership detail with lifecycle actions.
class MembershipDetailScreen extends StatefulWidget {
  /// Creates the membership detail screen.
  const MembershipDetailScreen({
    super.key,
    required this.repository,
    required this.membershipId,
    this.strings = const MembershipsStrings(),
  });

  /// Data source used for reads and lifecycle actions.
  final MembershipsRepository repository;

  /// Subscription to display.
  final String membershipId;

  /// Localized labels.
  final MembershipsStrings strings;

  @override
  State<MembershipDetailScreen> createState() => _MembershipDetailScreenState();
}

class _MembershipDetailScreenState extends State<MembershipDetailScreen> {
  MembershipDetail? _detail;
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final detail = await widget.repository.getMembership(widget.membershipId);
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _loading = false;
      });
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() {
        _error = _clean(error);
        _loading = false;
      });
    }
  }

  String _clean(Object error) =>
      error is MembershipsApiException ? error.message : error.toString();

  Future<void> _act(
    Future<MembershipDetail> Function() action,
    String success,
  ) async {
    setState(() => _busy = true);
    try {
      final detail = await action();
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _busy = false;
      });
      _showMessage(success);
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _showMessage(_clean(error));
    }
  }

  Future<void> _freeze() async {
    final days = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FreezeSheet(strings: widget.strings),
    );
    if (days == null || !mounted) return;

    final today = DateTime.now().toUtc();
    final until = DateTime.utc(
      today.year,
      today.month,
      today.day,
    ).add(Duration(days: days));
    await _act(
      () => widget.repository.freezeMembership(
        widget.membershipId,
        until: until,
        reason: 'Self-service freeze from the member app',
      ),
      widget.strings.freezeSuccess,
    );
  }

  Future<void> _renew() async {
    final periods = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _RenewSheet(strings: widget.strings),
    );
    if (periods == null || !mounted) return;
    await _act(
      () => widget.repository.renewMembership(
        widget.membershipId,
        periods: periods,
      ),
      widget.strings.renewSuccess,
    );
  }

  Future<void> _resume() async {
    await _act(
      () => widget.repository.resumeMembership(widget.membershipId),
      widget.strings.resumeSuccess,
    );
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(widget.strings.cancelTitle),
        content: Text(widget.strings.cancelBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(widget.strings.keepMembership),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: KinevorMembershipsTheme.error,
            ),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(widget.strings.confirmCancel),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await _act(
      () => widget.repository.cancelMembership(widget.membershipId),
      widget.strings.cancelSuccess,
    );
  }

  Future<void> _browsePlans() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => MembershipPlansScreen(
          repository: widget.repository,
          strings: widget.strings,
        ),
      ),
    );
    if (!mounted) return;
    final detail = _detail;
    if (detail != null && (detail.isExpired || detail.isCancelled)) {
      Navigator.of(context).pop();
      return;
    }
    await _load();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    final detail = _detail;
    return Scaffold(
      appBar: AppBar(title: Text(detail?.planName ?? strings.detailTitle)),
      body: SafeArea(
        child: Stack(
          children: [
            if (_loading && detail == null)
              const Center(child: CircularProgressIndicator())
            else if (detail == null)
              MembershipErrorState(
                message: _error ?? strings.loadError,
                strings: strings,
                onRetry: _load,
              )
            else
              RefreshIndicator(
                onRefresh: _load,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _DetailHero(membership: detail, strings: strings),
                      if (detail.isFrozen && detail.frozenUntil != null) ...[
                        const SizedBox(height: 10),
                        MembershipFreezeBanner(
                          until: detail.frozenUntil!,
                          reason: detail.freezeReason,
                          strings: strings,
                        ),
                      ],
                      const SizedBox(height: 12),
                      _FactsCard(membership: detail, strings: strings),
                      if (detail.features.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        _DetailIncluded(
                          features: detail.features,
                          strings: strings,
                        ),
                      ],
                      const SizedBox(height: 16),
                      _ActionsCard(
                        membership: detail,
                        strings: strings,
                        busy: _busy,
                        onRenew: _renew,
                        onFreeze: _freeze,
                        onResume: _resume,
                        onCancel: _cancel,
                        onBrowse: _browsePlans,
                      ),
                    ],
                  ),
                ),
              ),
            if (_busy)
              const Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(minHeight: 2),
              ),
          ],
        ),
      ),
    );
  }
}

class _DetailHero extends StatelessWidget {
  const _DetailHero({required this.membership, required this.strings});

  final MembershipDetail membership;
  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: KinevorMembershipsTheme.heroGradient(membership.status),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: KinevorMembershipsTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              MembershipStatusChip(status: membership.status, strings: strings),
              const Spacer(),
              Text(
                strings.tierLabel(membership.tier),
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: KinevorMembershipsTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            membership.planName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontSize: 26,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            '${strings.money(membership.price, membership.currency)} '
            '${strings.billingLabel(membership.billingPeriod)} · '
            '${strings.termDays(membership.durationDays)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${membership.daysRemaining}',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  height: 1,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  strings.daysLeft(membership.daysRemaining),
                  style: const TextStyle(
                    fontSize: 11,
                    color: KinevorMembershipsTheme.textMuted,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                strings.date(membership.endDate),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: membership.termProgress,
              minHeight: 6,
              backgroundColor: KinevorMembershipsTheme.ink.withValues(
                alpha: 0.55,
              ),
              valueColor: AlwaysStoppedAnimation<Color>(
                KinevorMembershipsTheme.statusColor(membership.status),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FactsCard extends StatelessWidget {
  const _FactsCard({required this.membership, required this.strings});

  final MembershipDetail membership;
  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    final facts = [
      MembershipFact(
        icon: Icons.play_circle_outline,
        label: strings.started,
        value: strings.date(membership.startDate),
      ),
      MembershipFact(
        icon: Icons.event_outlined,
        label: strings.endsOn,
        value: strings.date(membership.endDate),
      ),
      MembershipFact(
        icon: Icons.timelapse_outlined,
        label: strings.term,
        value: strings.termDays(membership.durationDays),
      ),
      MembershipFact(
        icon: Icons.receipt_long_outlined,
        label: strings.billing,
        value: strings.billingName(membership.billingPeriod),
      ),
      MembershipFact(
        icon: Icons.sync_outlined,
        label: strings.autoRenew,
        value: membership.autoRenew
            ? strings.autoRenewOn
            : strings.autoRenewOff,
      ),
      MembershipFact(
        icon: Icons.payments_outlined,
        label: strings.price,
        value: strings.money(membership.price, membership.currency),
      ),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = (constraints.maxWidth - 14) / 2;
            return Wrap(
              spacing: 14,
              runSpacing: 14,
              children: [
                for (final fact in facts) SizedBox(width: width, child: fact),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _DetailIncluded extends StatelessWidget {
  const _DetailIncluded({required this.features, required this.strings});

  final List<String> features;
  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.included,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            for (final feature in features)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      size: 15,
                      color: KinevorMembershipsTheme.success,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        feature,
                        style: const TextStyle(fontSize: 12.5),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ActionsCard extends StatelessWidget {
  const _ActionsCard({
    required this.membership,
    required this.strings,
    required this.busy,
    required this.onRenew,
    required this.onFreeze,
    required this.onResume,
    required this.onCancel,
    required this.onBrowse,
  });

  final MembershipDetail membership;
  final MembershipsStrings strings;
  final bool busy;
  final VoidCallback onRenew;
  final VoidCallback onFreeze;
  final VoidCallback onResume;
  final VoidCallback onCancel;
  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(strings.manage, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            if (membership.isActive) ...[
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: busy ? null : onRenew,
                      child: Text(strings.renew),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: busy ? null : onFreeze,
                      child: Text(strings.freeze),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: busy ? null : onCancel,
                child: Text(strings.cancel),
              ),
            ] else if (membership.isFrozen) ...[
              FilledButton(
                onPressed: busy ? null : onResume,
                child: Text(strings.resume),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: busy ? null : onCancel,
                child: Text(strings.cancel),
              ),
            ] else
              FilledButton(
                onPressed: busy ? null : onBrowse,
                child: Text(strings.browsePlans),
              ),
          ],
        ),
      ),
    );
  }
}

class _FreezeSheet extends StatefulWidget {
  const _FreezeSheet({required this.strings});

  final MembershipsStrings strings;

  @override
  State<_FreezeSheet> createState() => _FreezeSheetState();
}

class _FreezeSheetState extends State<_FreezeSheet> {
  static const _durations = [7, 14, 30, 60, 90];
  int _days = 30;

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            strings.freezeTitle,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 6),
          Text(
            strings.freezeBody,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            strings.freezeLength.toUpperCase(),
            style: const TextStyle(
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final days in _durations)
                ChoiceChip(
                  label: Text(strings.freezeLengthLabel(days)),
                  selected: _days == days,
                  onSelected: (_) => setState(() => _days = days),
                  selectedColor: KinevorMembershipsTheme.accent.withValues(
                    alpha: 0.2,
                  ),
                  labelStyle: TextStyle(
                    color: _days == days
                        ? KinevorMembershipsTheme.accent
                        : KinevorMembershipsTheme.text,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  side: BorderSide(
                    color: _days == days
                        ? KinevorMembershipsTheme.accent.withValues(alpha: 0.5)
                        : KinevorMembershipsTheme.border,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(_days),
            child: Text(strings.freezeConfirm),
          ),
        ],
      ),
    );
  }
}

class _RenewSheet extends StatefulWidget {
  const _RenewSheet({required this.strings});

  final MembershipsStrings strings;

  @override
  State<_RenewSheet> createState() => _RenewSheetState();
}

class _RenewSheetState extends State<_RenewSheet> {
  static const _options = [1, 3, 6, 12];
  int _periods = 1;

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            strings.renewTitle,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 6),
          Text(
            strings.renewBody,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            strings.periods.toUpperCase(),
            style: const TextStyle(
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final periods in _options)
                ChoiceChip(
                  label: Text(strings.periodCount(periods)),
                  selected: _periods == periods,
                  onSelected: (_) => setState(() => _periods = periods),
                  selectedColor: KinevorMembershipsTheme.accent.withValues(
                    alpha: 0.2,
                  ),
                  labelStyle: TextStyle(
                    color: _periods == periods
                        ? KinevorMembershipsTheme.accent
                        : KinevorMembershipsTheme.text,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  side: BorderSide(
                    color: _periods == periods
                        ? KinevorMembershipsTheme.accent.withValues(alpha: 0.5)
                        : KinevorMembershipsTheme.border,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(_periods),
            child: Text(strings.renewConfirm),
          ),
        ],
      ),
    );
  }
}
