import 'package:flutter/material.dart';
import 'package:kinevor_memberships/kinevor_memberships.dart';

const String _apiBaseUrl = String.fromEnvironment(
  'KINEVOR_API_BASE_URL',
  defaultValue: 'http://localhost:5084/api/v1',
);

void main() => runApp(const MembershipsDemoApp());

/// Demo application hosting [MembershipDashboardScreen] against the DemoApi.
class MembershipsDemoApp extends StatefulWidget {
  /// Creates the demo app.
  const MembershipsDemoApp({
    super.key,
    this.baseUrl = _apiBaseUrl,
    this.initialMemberId = _mayaId,
  });

  /// API root used for the demo client.
  final String baseUrl;

  /// Member selected on first launch.
  final String initialMemberId;

  @override
  State<MembershipsDemoApp> createState() => _MembershipsDemoAppState();
}

class _MembershipsDemoAppState extends State<MembershipsDemoApp> {
  late _DemoMember _member;
  late KinevorMembershipsClient _client;
  late MembershipsRepository _repository;

  @override
  void initState() {
    super.initState();
    _member = _members.firstWhere(
      (member) => member.id == widget.initialMemberId,
      orElse: () => _members.first,
    );
    _connect(_member);
  }

  void _connect(_DemoMember member) {
    final client = KinevorMembershipsClient(
      baseUrl: Uri.parse(widget.baseUrl),
      headers: {'X-Demo-Role': 'Member', 'X-Demo-Member': member.id},
    );
    _client = client;
    _repository = RemoteMembershipsRepository(client);
  }

  void _select(_DemoMember member) {
    if (member.id == _member.id) return;
    final previous = _client;
    setState(() {
      _member = member;
      _connect(member);
    });
    previous.close();
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kinevor Memberships',
      debugShowCheckedModeBanner: false,
      theme: KinevorMembershipsTheme.dark(),
      home: MembershipDashboardScreen(
        key: ValueKey(_member.id),
        repository: _repository,
        actions: [
          PopupMenuButton<_DemoMember>(
            tooltip: 'Preview as',
            icon: const Icon(Icons.person_outline),
            onSelected: _select,
            itemBuilder: (_) => [
              for (final member in _members)
                CheckedPopupMenuItem(
                  value: member,
                  checked: member.id == _member.id,
                  child: Text(member.name),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DemoMember {
  const _DemoMember(this.id, this.name);

  final String id;
  final String name;
}

const _mayaId = '11111111-1111-1111-1111-111111111111';

const _members = [
  _DemoMember(_mayaId, 'Maya Thompson'),
  _DemoMember('22222222-2222-2222-2222-222222222222', 'Daniel Okafor'),
  _DemoMember('33333333-3333-3333-3333-333333333333', 'Sofia Rossi'),
  _DemoMember('44444444-4444-4444-4444-444444444444', 'Liam Chen'),
  _DemoMember('55555555-5555-5555-5555-555555555555', 'Amina Yusuf'),
];
