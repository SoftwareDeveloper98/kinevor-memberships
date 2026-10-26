import 'package:flutter/material.dart';

import '../theme/kinevor_memberships_theme.dart';
import '../theme/memberships_strings.dart';

/// Compact status badge with icon and label.
class MembershipStatusChip extends StatelessWidget {
  /// Creates a status badge.
  const MembershipStatusChip({
    super.key,
    required this.status,
    required this.strings,
  });

  /// Lifecycle status returned by the API.
  final String status;

  /// Localized labels.
  final MembershipsStrings strings;

  @override
  Widget build(BuildContext context) {
    final color = KinevorMembershipsTheme.statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            KinevorMembershipsTheme.statusIcon(status),
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            strings.statusLabel(status).toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Full-width load failure with a retry action.
class MembershipErrorState extends StatelessWidget {
  /// Creates an error state.
  const MembershipErrorState({
    super.key,
    required this.message,
    required this.strings,
    required this.onRetry,
  });

  /// Failure message.
  final String message;

  /// Localized labels.
  final MembershipsStrings strings;

  /// Retry callback.
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 34,
              color: KinevorMembershipsTheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: KinevorMembershipsTheme.textMuted,
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: Text(strings.retry)),
          ],
        ),
      ),
    );
  }
}

/// Frosted banner shown while cover is paused.
class MembershipFreezeBanner extends StatelessWidget {
  /// Creates a freeze banner.
  const MembershipFreezeBanner({
    super.key,
    required this.until,
    required this.strings,
    this.reason,
  });

  /// Last day of the freeze.
  final DateTime until;

  /// Localized labels.
  final MembershipsStrings strings;

  /// Optional reason recorded for the freeze.
  final String? reason;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: KinevorMembershipsTheme.info.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: KinevorMembershipsTheme.info.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.ac_unit_outlined,
            size: 17,
            color: KinevorMembershipsTheme.info,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              [
                strings.frozenBanner(until),
                if (reason != null && reason!.isNotEmpty)
                  '${strings.freezeReason}: $reason',
              ].join(' | '),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: KinevorMembershipsTheme.info,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Labelled fact with an icon, used in detail grids.
class MembershipFact extends StatelessWidget {
  /// Creates a fact.
  const MembershipFact({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  /// Fact icon.
  final IconData icon;

  /// Fact label.
  final String label;

  /// Fact value.
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 15, color: KinevorMembershipsTheme.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: KinevorMembershipsTheme.textMuted,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
