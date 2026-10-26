import 'package:flutter/material.dart';

import '../data/memberships_api_exception.dart';
import '../data/memberships_repository.dart';
import '../models/membership.dart';
import '../theme/kinevor_memberships_theme.dart';
import '../theme/memberships_strings.dart';
import 'membership_detail_screen.dart';
import 'membership_shared.dart';

/// Catalogue of purchasable membership plans with a start action.
class MembershipPlansScreen extends StatefulWidget {
  /// Creates the plan catalogue.
  const MembershipPlansScreen({
    super.key,
    required this.repository,
    this.strings = const MembershipsStrings(),
  });

  /// Data source used for plans, current cover and starts.
  final MembershipsRepository repository;

  /// Localized labels.
  final MembershipsStrings strings;

  @override
  State<MembershipPlansScreen> createState() => _MembershipPlansScreenState();
}

class _MembershipPlansScreenState extends State<MembershipPlansScreen> {
  List<MembershipPlan> _plans = const [];
  MembershipDetail? _current;
  bool _loading = true;
  String? _error;
  String? _startingId;

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
      final plans = await widget.repository.getPlans();
      final current = await widget.repository.getCurrentMembership();
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _current = current;
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

  Future<void> _start(MembershipPlan plan) async {
    setState(() => _startingId = plan.id);
    try {
      final created = await widget.repository.startMembership(
        plan.id,
        autoRenew: true,
      );
      if (!mounted) return;
      setState(() => _startingId = null);
      await Navigator.of(context).pushReplacement<void, void>(
        MaterialPageRoute(
          builder: (_) => MembershipDetailScreen(
            repository: widget.repository,
            membershipId: created.id,
            strings: widget.strings,
          ),
        ),
      );
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() => _startingId = null);
      _showMessage(_clean(error));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Scaffold(
      appBar: AppBar(title: Text(strings.plansTitle)),
      body: SafeArea(
        child: Stack(
          children: [
            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_error != null)
              MembershipErrorState(
                message: _error!,
                strings: strings,
                onRetry: _load,
              )
            else if (_plans.isEmpty)
              _EmptyCatalogue(strings: strings)
            else
              RefreshIndicator(
                onRefresh: _load,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _CatalogueHeader(strings: strings),
                      const SizedBox(height: 16),
                      for (var index = 0; index < _plans.length; index++) ...[
                        _PlanCard(
                          plan: _plans[index],
                          featured: index == 1,
                          isCurrent: _plans[index].id == _current?.planId,
                          starting: _startingId == _plans[index].id,
                          strings: strings,
                          onStart: () => _start(_plans[index]),
                        ),
                        if (index != _plans.length - 1)
                          const SizedBox(height: 12),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CatalogueHeader extends StatelessWidget {
  const _CatalogueHeader({required this.strings});

  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            KinevorMembershipsTheme.accent.withValues(alpha: 0.18),
            KinevorMembershipsTheme.surfaceRaised,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: KinevorMembershipsTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            strings.plansEyebrow,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: KinevorMembershipsTheme.accent,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            strings.catalogueHeadline,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 4),
          Text(
            strings.catalogueIntro,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.featured,
    required this.isCurrent,
    required this.starting,
    required this.strings,
    required this.onStart,
  });

  final MembershipPlan plan;
  final bool featured;
  final bool isCurrent;
  final bool starting;
  final MembershipsStrings strings;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: KinevorMembershipsTheme.surfaceRaised,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: featured
              ? KinevorMembershipsTheme.accent.withValues(alpha: 0.55)
              : KinevorMembershipsTheme.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            plan.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.check_circle,
                            size: 15,
                            color: KinevorMembershipsTheme.success,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      strings.tierLabel(plan.tier),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: KinevorMembershipsTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (featured)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: KinevorMembershipsTheme.accent.withValues(
                      alpha: 0.14,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    strings.mostPopular,
                    style: const TextStyle(
                      fontSize: 7.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                      color: KinevorMembershipsTheme.accent,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            plan.description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: KinevorMembershipsTheme.textMuted,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                strings.money(plan.price, plan.currency),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                  height: 1,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  strings.billingLabel(plan.billingPeriod),
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: KinevorMembershipsTheme.textMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),
          for (final feature in plan.features)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
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
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          if (isCurrent)
            OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.check, size: 16),
              label: Text(strings.currentPlan),
            )
          else
            FilledButton(
              onPressed: starting ? null : onStart,
              child: starting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: KinevorMembershipsTheme.onAccent,
                      ),
                    )
                  : Text(strings.startMembership),
            ),
        ],
      ),
    );
  }
}

class _EmptyCatalogue extends StatelessWidget {
  const _EmptyCatalogue({required this.strings});

  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.workspace_premium_outlined,
              size: 36,
              color: KinevorMembershipsTheme.textMuted,
            ),
            const SizedBox(height: 12),
            Text(
              strings.noPlans,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              strings.noPlansBody,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: KinevorMembershipsTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
