import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/membership.dart';
import 'memberships_api_exception.dart';

/// HTTP client for the Kinevor membership self-service API.
///
/// Extra [headers] are attached to every request. The demo uses them for the
/// development-only `X-Demo-Role` and `X-Demo-Member` trust headers, while a
/// production host can supply an authenticated client instead.
class KinevorMembershipsClient {
  /// Creates a client rooted at [baseUrl], for example
  /// `https://api.example.com/api/v1`.
  KinevorMembershipsClient({
    required Uri baseUrl,
    http.Client? httpClient,
    Map<String, String> headers = const {},
  }) : _baseUrl = baseUrl,
       _http = httpClient ?? http.Client(),
       _ownsClient = httpClient == null,
       _headers = Map.unmodifiable(headers);

  final Uri _baseUrl;
  final http.Client _http;
  final bool _ownsClient;
  final Map<String, String> _headers;

  /// Loads the active plan catalogue.
  Future<List<MembershipPlan>> fetchPlans() async {
    final data = await _list('GET', 'plans');
    return [
      for (final item in data)
        MembershipPlan.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  /// Loads every subscription owned by the authenticated member.
  Future<List<MembershipSummary>> fetchMyMemberships() async {
    final data = await _list('GET', 'me/memberships');
    return [
      for (final item in data)
        MembershipSummary.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  /// Loads the member's current subscription, or `null` when none is current.
  Future<MembershipDetail?> fetchCurrentMembership() async {
    final data = await _optionalObject('GET', 'me/memberships/current');
    return data == null ? null : MembershipDetail.fromJson(data);
  }

  /// Loads one member-owned subscription.
  Future<MembershipDetail> fetchMembership(String id) async {
    final data = await _object('GET', 'me/memberships/${_segment(id)}');
    return MembershipDetail.fromJson(data);
  }

  /// Starts a subscription on [planId].
  Future<MembershipCreated> startMembership({
    required String planId,
    bool autoRenew = true,
    DateTime? startDate,
  }) async {
    final data = await _object(
      'POST',
      'me/memberships',
      body: {
        'planId': planId,
        'autoRenew': autoRenew,
        'startDate': ?startDate?.toUtc().toIso8601String(),
      },
    );
    return MembershipCreated.fromJson(data);
  }

  /// Freezes a subscription through [until], inclusive.
  Future<MembershipDetail> freezeMembership(
    String id, {
    required DateTime until,
    String? reason,
  }) async {
    final data = await _object(
      'POST',
      'me/memberships/${_segment(id)}/freeze',
      body: {
        'until': until.toUtc().toIso8601String(),
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      },
    );
    return MembershipDetail.fromJson(data);
  }

  /// Resumes a frozen subscription.
  Future<MembershipDetail> resumeMembership(String id) async {
    final data = await _object('POST', 'me/memberships/${_segment(id)}/resume');
    return MembershipDetail.fromJson(data);
  }

  /// Cancels a subscription immediately.
  Future<MembershipDetail> cancelMembership(String id) async {
    final data = await _object('POST', 'me/memberships/${_segment(id)}/cancel');
    return MembershipDetail.fromJson(data);
  }

  /// Extends a subscription by whole billing [periods].
  Future<MembershipDetail> renewMembership(String id, {int periods = 1}) async {
    final data = await _object(
      'POST',
      'me/memberships/${_segment(id)}/renew',
      body: {'periods': periods},
    );
    return MembershipDetail.fromJson(data);
  }

  /// Closes the underlying HTTP client when this instance created it.
  void close() {
    if (_ownsClient) _http.close();
  }

  String _segment(String value) => Uri.encodeComponent(value);

  Uri _endpoint(String path) {
    final base = _baseUrl.toString().replaceFirst(RegExp(r'/+$'), '');
    return Uri.parse('$base/$path');
  }

  Future<Map<String, dynamic>> _object(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final data = await _send(method, path, body: body);
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    throw const MembershipsApiException(
      'The memberships response has no data object.',
    );
  }

  Future<Map<String, dynamic>?> _optionalObject(
    String method,
    String path,
  ) async {
    final data = await _send(method, path);
    if (data == null) return null;
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    throw const MembershipsApiException(
      'The memberships response has no data object.',
    );
  }

  Future<List<Object?>> _list(String method, String path) async {
    final data = await _send(method, path);
    if (data is List) return data;
    throw const MembershipsApiException(
      'The memberships response has no data array.',
    );
  }

  Future<Object?> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final request = http.Request(method, _endpoint(path))
      ..headers.addAll({
        'Accept': 'application/json',
        if (body != null) 'Content-Type': 'application/json',
        ..._headers,
      });
    if (body != null) request.body = jsonEncode(body);

    final http.StreamedResponse streamed;
    try {
      streamed = await _http.send(request);
    } on Exception catch (error) {
      throw MembershipsApiException(
        'Could not reach the memberships API: $error',
      );
    }

    final response = await http.Response.fromStream(streamed);
    final Object? decoded;
    try {
      decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    } on FormatException {
      throw MembershipsApiException(
        'The memberships API returned invalid JSON.',
        statusCode: response.statusCode,
      );
    }

    if (decoded is! Map<String, dynamic>) {
      throw MembershipsApiException(
        'The memberships API returned an unexpected payload.',
        statusCode: response.statusCode,
      );
    }

    final success = decoded['success'] != false;
    if (response.statusCode < 200 || response.statusCode >= 300 || !success) {
      throw MembershipsApiException(
        _errorMessage(decoded) ?? 'The memberships request failed.',
        statusCode: response.statusCode,
      );
    }

    return decoded['data'];
  }

  String? _errorMessage(Map<String, dynamic> body) {
    final message = body['message'];
    if (message is String && message.isNotEmpty) return message;
    final errors = body['errors'];
    if (errors is List) {
      for (final error in errors) {
        if (error is String && error.isNotEmpty) return error;
        if (error is Map && error['message'] is String) {
          return error['message'] as String;
        }
      }
    }
    if (errors is Map) {
      for (final value in errors.values) {
        if (value is List) {
          for (final error in value) {
            if (error is String && error.isNotEmpty) return error;
          }
        }
      }
    }
    final detail = body['detail'];
    return detail is String && detail.isNotEmpty ? detail : null;
  }
}
