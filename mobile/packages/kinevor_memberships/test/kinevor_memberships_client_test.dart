import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kinevor_memberships/kinevor_memberships.dart';

Map<String, dynamic> planJson() => {
  'id': 'plan-1',
  'name': 'Performance',
  'description': 'More coaching, more classes, more recovery.',
  'tier': 'Premium',
  'billingPeriod': 'Quarterly',
  'durationDays': 90,
  'price': 89,
  'currency': 'GBP',
  'features': ['Unlimited classes', 'Recovery suite'],
  'isActive': true,
  'createdAt': '2026-01-01T00:00:00',
  'updatedAt': null,
};

Map<String, dynamic> detailJson() => {
  'id': 'membership-1',
  'memberId': 'member-1',
  'planId': 'plan-1',
  'planName': 'Performance',
  'tier': 'Premium',
  'billingPeriod': 'Quarterly',
  'durationDays': 90,
  'price': 89,
  'currency': 'GBP',
  'features': ['Unlimited classes', 'Recovery suite'],
  'startDate': '2026-09-12T00:00:00',
  'endDate': '2026-12-11T00:00:00',
  'status': 'Active',
  'daysRemaining': 51,
  'autoRenew': true,
  'notes': null,
  'frozenFrom': null,
  'frozenUntil': null,
  'freezeReason': null,
  'createdAt': '2026-09-12T00:00:00',
  'updatedAt': null,
  'rowVersion': '11111111-1111-1111-1111-111111111111',
};

http.Response envelope(Object? data, {int status = 200}) => http.Response(
  jsonEncode({'success': true, 'data': data}),
  status,
  headers: {'content-type': 'application/json'},
);

void main() {
  test('plans request sends demo headers and parses the catalogue', () async {
    late http.Request captured;
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1/'),
      headers: const {'X-Demo-Role': 'Member'},
      httpClient: MockClient((request) async {
        captured = request;
        return envelope([planJson()]);
      }),
    );

    final plans = await client.fetchPlans();

    expect(captured.method, 'GET');
    expect(captured.url.toString(), 'http://localhost:5084/api/v1/plans');
    expect(captured.headers['X-Demo-Role'], 'Member');
    expect(plans.single.name, 'Performance');
    expect(plans.single.price, 89);
    expect(plans.single.features, hasLength(2));
  });

  test('current membership handles a populated and empty payload', () async {
    var call = 0;
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient((request) async {
        expect(request.url.path, '/api/v1/me/memberships/current');
        call++;
        return envelope(call == 1 ? detailJson() : null);
      }),
    );

    final current = await client.fetchCurrentMembership();
    final empty = await client.fetchCurrentMembership();

    expect(current?.planName, 'Performance');
    expect(current?.daysRemaining, 51);
    expect(empty, isNull);
  });

  test('membership list and detail parse their projections', () async {
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient((request) async {
        if (request.url.path.endsWith('/memberships')) {
          return envelope([detailJson()]);
        }
        return envelope(detailJson());
      }),
    );

    final list = await client.fetchMyMemberships();
    final detail = await client.fetchMembership('membership-1');

    expect(list.single.status, 'Active');
    expect(list.single.termProgress, closeTo(39 / 90, 0.001));
    expect(detail.features, contains('Recovery suite'));
    expect(detail.rowVersion, '11111111-1111-1111-1111-111111111111');
  });

  test('start and freeze send the expected bodies', () async {
    final requests = <http.Request>[];
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient((request) async {
        requests.add(request);
        if (request.url.path.endsWith('/memberships')) {
          return envelope({'id': 'membership-new'}, status: 201);
        }
        return envelope(detailJson());
      }),
    );

    final created = await client.startMembership(
      planId: 'plan-1',
      autoRenew: false,
    );
    await client.freezeMembership(
      'membership-1',
      until: DateTime.utc(2026, 11, 20),
      reason: 'Travel',
    );

    expect(created.id, 'membership-new');
    expect(requests[0].method, 'POST');
    expect(requests[0].url.path, '/api/v1/me/memberships');
    expect(jsonDecode(requests[0].body), {
      'planId': 'plan-1',
      'autoRenew': false,
    });
    expect(requests[1].method, 'POST');
    expect(requests[1].url.path, '/api/v1/me/memberships/membership-1/freeze');
    expect(jsonDecode(requests[1].body), {
      'until': '2026-11-20T00:00:00.000Z',
      'reason': 'Travel',
    });
  });

  test('resume, cancel and renew use lifecycle routes', () async {
    final requests = <http.Request>[];
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient((request) async {
        requests.add(request);
        return envelope(detailJson());
      }),
    );

    await client.resumeMembership('membership-1');
    await client.cancelMembership('membership-1');
    await client.renewMembership('membership-1', periods: 3);

    expect(requests[0].method, 'POST');
    expect(requests[0].url.path, '/api/v1/me/memberships/membership-1/resume');
    expect(requests[1].url.path, '/api/v1/me/memberships/membership-1/cancel');
    expect(requests[2].url.path, '/api/v1/me/memberships/membership-1/renew');
    expect(jsonDecode(requests[2].body), {'periods': 3});
  });

  test('failed requests surface the API message', () async {
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient(
        (_) async => http.Response(
          jsonEncode({
            'success': false,
            'message': 'No linked member profile.',
          }),
          403,
        ),
      ),
    );

    await expectLater(
      client.fetchCurrentMembership(),
      throwsA(
        isA<MembershipsApiException>()
            .having((error) => error.statusCode, 'status', 403)
            .having(
              (error) => error.message,
              'message',
              'No linked member profile.',
            ),
      ),
    );
  });

  test('network failures are wrapped', () async {
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse('http://localhost:5084/api/v1'),
      httpClient: MockClient((_) async => throw Exception('offline')),
    );

    await expectLater(
      client.fetchPlans(),
      throwsA(isA<MembershipsApiException>()),
    );
  });
}
