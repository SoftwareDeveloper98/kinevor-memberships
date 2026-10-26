import 'package:flutter/material.dart';

import '../data/memberships_api_exception.dart';
import '../data/memberships_repository.dart';
import '../models/membership.dart';
import '../theme/kinevor_memberships_theme.dart';
import '../theme/memberships_strings.dart';
import 'membership_detail_screen.dart';
import 'membership_plans_screen.dart';
import 'membership_shared.dart';

/// Member dashboard with current cover, plan benefits and history.
class MembershipDashboardScreen extends StatefulWidget {
  /// Creates the membership dashboard.
  const MembershipDashboardScreen({
    super.key,
    required this.repository,
    this.strings = const MembershipsStrings(),
    this.actions = const [],
  });

  /// Data source used for membership reads.
  final MembershipsRepository repository;

  /// Localized labels.
  final MembershipsStrings strings;

  /// Optional host actions shown in the app bar, for example a demo switcher.
  final List<Widget> actions;

  @override
  State<MembershipDashboardScreen> createState() =>
      _MembershipDashboardScreenState();
}

class _MembershipDashboardScreenState extends State<MembershipDashboardScreen> {
  MembershipDetail? _current;
  List<MembershipSummary> _history = const [];
  bool _loading = true;
  bool _loaded = false;
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
      final current = await widget.repository.getCurrentMembership();
      final all = await widget.repository.getMyMemberships();
      if (!mounted) return;
      setState(() {
        _current = current;
        _history = [
          for (final membership in all)
            if (membership.id != current?.id) membership,
        ];
        _loading = false;
        _loaded = true;
      });
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() {
        _error = _clean(error);
        _loading = false;
        _loaded = true;
      });
    }
  }

  String _clean(Object error) =>
      error is MembershipsApiException ? error.message : error.toString();

  Future<void> _openPlans() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => MembershipPlansScreen(
          repository: widget.repository,
          strings: widget.strings,
        ),
      ),
    );
    if (mounted) await _load();
  }

  Future<void> _openDetail(String id) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => MembershipDetailScreen(
          repository: widget.repository,
          membershipId: id,
          strings: widget.strings,
        ),
      ),
    );
    if (mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Scaffold(
      appBar: AppBar(
        title: Text(strings.dashboardTitle),
        actions: [
          ...widget.actions,
          IconButton(
            tooltip: strings.plansTitle,
            onPressed: _openPlans,
            icon: const Icon(Icons.grid_view_rounded),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            if (_loading && !_loaded)
              const Center(child: CircularProgressIndicator())
            else if (_current == null && _error != null)
              MembershipErrorState(
                message: _error!,
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
                      if (_current != null)
                        _CurrentCover(
                          membership: _current!,
                          strings: strings,
                          onManage: () => _openDetail(_current!.id),
                          onBrowse: _openPlans,
                        )
                      else
                        _NoCurrentCover(strings: strings, onBrowse: _openPlans),
                      if (_current != null) ...[
                        if (_current!.isFrozen &&
                            _current!.frozenUntil != null) ...[
                          const SizedBox(height: 10),
                          MembershipFreezeBanner(
                            until: _current!.frozenUntil!,
                            reason: _current!.freezeReason,
                            strings: strings,
                          ),
                        ],
                        const SizedBox(height: 12),
                        _StatsRow(membership: _current!, strings: strings),
                        if (_current!.features.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _IncludedCard(
                            features: _current!.features,
                            strings: strings,
                          ),
                        ],
                      ],
                      const SizedBox(height: 16),
                      _HistoryCard(
                        memberships: _history,
                        strings: strings,
                        onOpen: _openDetail,
                      ),
                    ],
                  ),
                ),
              ),
            if (_loading && _loaded)
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

class _CurrentCover extends StatelessWidget {
  const _CurrentCover({
    required this.membership,
    required this.strings,
    required this.onManage,
    required this.onBrowse,
  });

  final MembershipDetail membership;
  final MembershipsStrings strings;
  final VoidCallback onManage;
  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    final status = membership.status;
    final date = membership.autoRenew ? strings.renewsOn : strings.endsOn;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: KinevorMembershipsTheme.heroGradient(status),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: KinevorMembershipsTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              MembershipStatusChip(status: status, strings: strings),
              const Spacer(),
              if (membership.autoRenew)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: KinevorMembershipsTheme.ink.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'AUTO-RENEW',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: KinevorMembershipsTheme.textMuted,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            strings.currentCover,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: KinevorMembershipsTheme.accent,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            membership.planName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontSize: 27,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            '${strings.tierLabel(membership.tier)} · '
            '${strings.money(membership.price, membership.currency)} '
            '${strings.billingLabel(membership.billingPeriod)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.only(top: 12),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: KinevorMembershipsTheme.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${membership.daysRemaining}',
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          height: 1,
                          letterSpacing: -0.8,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        strings.daysRemaining.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.7,
                          color: KinevorMembershipsTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 38,
                  color: KinevorMembershipsTheme.border,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        date.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.7,
                          color: KinevorMembershipsTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        strings.date(membership.endDate),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
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
                KinevorMembershipsTheme.statusColor(status),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: onManage,
                  child: Text(strings.manage),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: onBrowse,
                  child: Text(strings.browsePlans),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NoCurrentCover extends StatelessWidget {
  const _NoCurrentCover({required this.strings, required this.onBrowse});

  final MembershipsStrings strings;
  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: KinevorMembershipsTheme.surfaceRaised,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: KinevorMembershipsTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: KinevorMembershipsTheme.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(13),
            ),
            alignment: Alignment.center,
            child: const Icon(
              Icons.fitness_center,
              size: 22,
              color: KinevorMembershipsTheme.accent,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            strings.noCurrent,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 5),
          Text(
            strings.noCurrentBody,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onBrowse, child: Text(strings.browsePlans)),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.membership, required this.strings});

  final MembershipDetail membership;
  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            value: '${membership.daysRemaining}',
            label: strings.daysRemaining,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(
            value: strings.termDays(membership.durationDays),
            label: strings.term,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(
            value: strings.billingName(membership.billingPeriod),
            label: strings.billing,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 11),
      decoration: BoxDecoration(
        color: KinevorMembershipsTheme.surfaceRaised,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: KinevorMembershipsTheme.border),
      ),
      child: Column(
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 7.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _IncludedCard extends StatelessWidget {
  const _IncludedCard({required this.features, required this.strings});

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
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.memberships,
    required this.strings,
    required this.onOpen,
  });

  final List<MembershipSummary> memberships;
  final MembershipsStrings strings;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              strings.historyTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            if (memberships.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  strings.noHistory,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KinevorMembershipsTheme.textMuted,
                  ),
                ),
              )
            else
              for (var index = 0; index < memberships.length; index++) ...[
                _HistoryRow(
                  membership: memberships[index],
                  strings: strings,
                  onTap: () => onOpen(memberships[index].id),
                ),
                if (index != memberships.length - 1) const Divider(),
              ],
          ],
        ),
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({
    required this.membership,
    required this.strings,
    required this.onTap,
  });

  final MembershipSummary membership;
  final MembershipsStrings strings;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = KinevorMembershipsTheme.statusColor(membership.status);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 9),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Icon(
                KinevorMembershipsTheme.statusIcon(membership.status),
                size: 17,
                color: color,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    membership.planName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${strings.date(membership.startDate)} – '
                    '${strings.date(membership.endDate)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 9.5,
                      color: KinevorMembershipsTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              strings.statusLabel(membership.status),
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(width: 2),
            const Icon(
              Icons.chevron_right,
              size: 18,
              color: KinevorMembershipsTheme.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}
