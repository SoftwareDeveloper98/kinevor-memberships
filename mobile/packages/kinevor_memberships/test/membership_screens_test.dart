import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinevor_memberships/kinevor_memberships.dart';

import 'fake_memberships_repository.dart';

void main() {
  testWidgets('dashboard renders current cover, stats and history', (
    tester,
  ) async {
    final repository = FakeMembershipsRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDashboardScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Performance'), findsOneWidget);
    expect(find.text('ACTIVE'), findsOneWidget);
    expect(find.text('51'), findsWidgets);
    expect(find.text('Premium tier · £129.00 per quarter'), findsOneWidget);
    expect(find.text('Foundation'), findsOneWidget);
    expect(find.text('Membership history'), findsOneWidget);
  });

  testWidgets('dashboard opens the catalogue and starts a plan', (
    tester,
  ) async {
    final repository = FakeMembershipsRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDashboardScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Membership plans'));
    await tester.pumpAndSettle();

    expect(find.text('Choose how you train'), findsOneWidget);
    expect(find.text('Current plan'), findsOneWidget);
    expect(find.text('Start membership'), findsNWidgets(2));

    await tester.tap(find.text('Start membership').first);
    await tester.pumpAndSettle();

    expect(repository.startCalls, 1);
    expect(repository.lastPlanId, samplePlans.first.id);
    expect(repository.currentMembership.planName, 'Foundation');
    expect(find.text('Manage plan'), findsWidgets);
  });

  testWidgets('detail freezes cover for the selected duration', (tester) async {
    final repository = FakeMembershipsRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDetailScreen(
          repository: repository,
          membershipId: sampleCurrent.id,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Freeze membership'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Freeze membership'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('14 days'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Freeze membership').last);
    await tester.pumpAndSettle();

    expect(repository.freezeCalls, 1);
    expect(repository.lastMembershipId, sampleCurrent.id);
    expect(repository.lastUntil, isNotNull);
    expect(repository.lastReason, contains('member app'));
    expect(find.text('FROZEN'), findsOneWidget);
    expect(find.text('Membership frozen.'), findsOneWidget);
  });

  testWidgets('detail cancels cover after confirmation', (tester) async {
    final repository = FakeMembershipsRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDetailScreen(
          repository: repository,
          membershipId: sampleCurrent.id,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Cancel membership'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel membership'));
    await tester.pumpAndSettle();

    expect(find.text('Cancel membership?'), findsOneWidget);
    await tester.tap(find.text('Cancel membership').last);
    await tester.pumpAndSettle();

    expect(repository.cancelCalls, 1);
    expect(find.text('CANCELLED'), findsOneWidget);
    expect(find.text('Membership cancelled.'), findsOneWidget);
  });

  testWidgets('load failures show a retry action', (tester) async {
    final repository = FakeMembershipsRepository(
      failure: const MembershipsApiException('Memberships API unavailable.'),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDashboardScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Memberships API unavailable.'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });
}
