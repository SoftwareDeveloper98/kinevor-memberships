import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinevor_memberships/kinevor_memberships.dart';

import 'fake_memberships_repository.dart';

Future<void> _loadFonts() async {
  final bytes = await File('assets/fonts/Sora-Variable.ttf').readAsBytes();
  final sora = FontLoader('Sora')
    ..addFont(Future<ByteData>.value(ByteData.sublistView(bytes)));
  await sora.load();

  final material = await rootBundle.load('fonts/MaterialIcons-Regular.otf');
  final icons = FontLoader('MaterialIcons')
    ..addFont(Future<ByteData>.value(material));
  await icons.load();
}

void main() {
  setUpAll(_loadFonts);

  testWidgets('membership dashboard golden', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipDashboardScreen(
          repository: FakeMembershipsRepository(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MembershipDashboardScreen),
      matchesGoldenFile('goldens/membership_dashboard.png'),
    );
  });

  testWidgets('membership plans golden', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembershipsTheme.dark(),
        home: MembershipPlansScreen(repository: FakeMembershipsRepository()),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MembershipPlansScreen),
      matchesGoldenFile('goldens/membership_plans.png'),
    );
  });
}
