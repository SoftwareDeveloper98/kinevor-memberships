/// Failure reported by the Kinevor memberships API.
class MembershipsApiException implements Exception {
  /// Creates an exception with a message and optional HTTP status.
  const MembershipsApiException(this.message, {this.statusCode});

  /// Human-readable failure.
  final String message;

  /// HTTP status code, when a response was received.
  final int? statusCode;

  @override
  String toString() => 'MembershipsApiException($statusCode): $message';
}
