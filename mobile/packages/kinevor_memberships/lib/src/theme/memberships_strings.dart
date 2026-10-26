/// User-facing labels used by the memberships widgets.
class MembershipsStrings {
  /// Creates a label bundle.
  const MembershipsStrings({
    this.brand = 'Kinevor Memberships',
    this.dashboardTitle = 'My membership',
    this.plansTitle = 'Membership plans',
    this.detailTitle = 'Membership',
    this.eyebrow = 'MEMBER PORTAL',
    this.currentCover = 'CURRENT COVER',
    this.plansEyebrow = 'MEMBERSHIP PLANS',
    this.catalogueHeadline = 'Choose how you train',
    this.catalogueIntro =
        'Set your term and billing rhythm. Change plans when your training does.',
    this.currentPlan = 'Current plan',
    this.mostPopular = 'MOST POPULAR',
    this.included = 'Included in your plan',
    this.historyTitle = 'Membership history',
    this.noHistory = 'No previous memberships yet.',
    this.browsePlans = 'Browse plans',
    this.manage = 'Manage plan',
    this.startMembership = 'Start membership',
    this.viewMembership = 'View membership',
    this.details = 'Membership details',
    this.daysRemaining = 'Days remaining',
    this.renewsOn = 'Renews',
    this.endsOn = 'Ends',
    this.autoRenew = 'Auto-renew',
    this.autoRenewOn = 'On',
    this.autoRenewOff = 'Off',
    this.plan = 'Plan',
    this.status = 'Status',
    this.billing = 'Billing',
    this.term = 'Term',
    this.started = 'Started',
    this.price = 'Price',
    this.frozenUntil = 'Frozen until',
    this.freezeReason = 'Freeze reason',
    this.freeze = 'Freeze membership',
    this.resume = 'Resume membership',
    this.cancel = 'Cancel membership',
    this.renew = 'Renew membership',
    this.freezeTitle = 'Freeze membership',
    this.freezeBody =
        'Your end date moves by the freeze length. You can freeze for up to 90 days.',
    this.freezeLength = 'Freeze length',
    this.freezeConfirm = 'Freeze membership',
    this.freezeSuccess = 'Membership frozen.',
    this.resumeSuccess = 'Membership resumed.',
    this.cancelTitle = 'Cancel membership?',
    this.cancelBody =
        'This ends your cover immediately. You can start a new membership whenever you are ready.',
    this.keepMembership = 'Keep membership',
    this.confirmCancel = 'Cancel membership',
    this.cancelSuccess = 'Membership cancelled.',
    this.renewTitle = 'Renew membership',
    this.renewBody =
        'Add whole billing periods to the end of your current cover.',
    this.renewConfirm = 'Renew membership',
    this.renewSuccess = 'Membership renewed.',
    this.periods = 'Periods',
    this.loadError = 'Could not load your membership.',
    this.retry = 'Try again',
    this.actionFailed = 'The request could not be completed.',
    this.noCurrent = 'No current membership',
    this.noCurrentBody =
        'Choose a plan to unlock the gym floor, classes and member benefits.',
    this.noPlans = 'No plans available',
    this.noPlansBody = 'Check back soon. The plan catalogue is being updated.',
    this.unknown = 'Unknown',
    this.close = 'Close',
    this.today = 'today',
  });

  /// Small brand label.
  final String brand;

  /// Dashboard title.
  final String dashboardTitle;

  /// Plan catalogue title.
  final String plansTitle;

  /// Detail screen fallback title.
  final String detailTitle;

  /// Small eyebrow above dashboard hero content.
  final String eyebrow;

  /// Eyebrow inside the current-cover hero.
  final String currentCover;

  /// Eyebrow above the plan catalogue.
  final String plansEyebrow;

  /// Plan catalogue headline.
  final String catalogueHeadline;

  /// Plan catalogue introduction.
  final String catalogueIntro;

  /// Current-plan button label.
  final String currentPlan;

  /// Badge on the featured plan.
  final String mostPopular;

  /// Included-benefits card title.
  final String included;

  /// History card title.
  final String historyTitle;

  /// Empty history message.
  final String noHistory;

  /// Catalogue navigation action.
  final String browsePlans;

  /// Detail navigation action.
  final String manage;

  /// Start action.
  final String startMembership;

  /// Open-detail action.
  final String viewMembership;

  /// Detail section label.
  final String details;

  /// Days-remaining stat label.
  final String daysRemaining;

  /// Renewal-date label.
  final String renewsOn;

  /// End-date label.
  final String endsOn;

  /// Auto-renew fact label.
  final String autoRenew;

  /// Auto-renew on value.
  final String autoRenewOn;

  /// Auto-renew off value.
  final String autoRenewOff;

  /// Plan fact label.
  final String plan;

  /// Status fact label.
  final String status;

  /// Billing fact label.
  final String billing;

  /// Term fact label.
  final String term;

  /// Start date fact label.
  final String started;

  /// Price fact label.
  final String price;

  /// Freeze end label.
  final String frozenUntil;

  /// Freeze reason label.
  final String freezeReason;

  /// Freeze action.
  final String freeze;

  /// Resume action.
  final String resume;

  /// Cancel action.
  final String cancel;

  /// Renew action.
  final String renew;

  /// Freeze sheet title.
  final String freezeTitle;

  /// Freeze sheet explanation.
  final String freezeBody;

  /// Freeze length field.
  final String freezeLength;

  /// Freeze confirmation.
  final String freezeConfirm;

  /// Freeze success message.
  final String freezeSuccess;

  /// Resume success message.
  final String resumeSuccess;

  /// Cancel dialog title.
  final String cancelTitle;

  /// Cancel dialog explanation.
  final String cancelBody;

  /// Cancel dialog dismissal.
  final String keepMembership;

  /// Cancel confirmation.
  final String confirmCancel;

  /// Cancel success message.
  final String cancelSuccess;

  /// Renew sheet title.
  final String renewTitle;

  /// Renew sheet explanation.
  final String renewBody;

  /// Renew confirmation.
  final String renewConfirm;

  /// Renew success message.
  final String renewSuccess;

  /// Renewal period field.
  final String periods;

  /// Initial load failure.
  final String loadError;

  /// Retry action.
  final String retry;

  /// Generic action failure.
  final String actionFailed;

  /// Empty current-cover title.
  final String noCurrent;

  /// Empty current-cover explanation.
  final String noCurrentBody;

  /// Empty catalogue title.
  final String noPlans;

  /// Empty catalogue explanation.
  final String noPlansBody;

  /// Unknown value label.
  final String unknown;

  /// Generic close action.
  final String close;

  /// Relative date label for today.
  final String today;

  /// Formats a full date.
  String date(DateTime value) =>
      '${_months[value.month - 1]} ${value.day}, ${value.year}';

  /// Formats a month and day.
  String monthDay(DateTime value) => '${_months[value.month - 1]} ${value.day}';

  /// Formats a money amount with its common symbol.
  String money(double value, String currency) {
    final symbol = switch (currency.toUpperCase()) {
      'GBP' => '£',
      'USD' => '\$',
      'EUR' => '€',
      _ => '${currency.toUpperCase()} ',
    };
    return '$symbol${value.toStringAsFixed(2)}';
  }

  /// Formats days of cover remaining.
  String daysLeft(int days) => switch (days) {
    <= 0 => 'Ends today',
    1 => '1 day remaining',
    _ => '$days days remaining',
  };

  /// Formats a freeze length in days.
  String freezeLengthLabel(int days) => days == 1 ? '1 day' : '$days days';

  /// Formats a billing period duration.
  String termDays(int days) => days == 1 ? '1 day' : '$days days';

  /// Formats a renewal period count.
  String periodCount(int periods) =>
      periods == 1 ? '1 billing period' : '$periods billing periods';

  /// Human label for a plan tier.
  String tierLabel(String tier) => tier.isEmpty ? unknown : '$tier tier';

  /// Human label for a billing period.
  String billingLabel(String period) => switch (period.toLowerCase()) {
    'monthly' => 'per month',
    'quarterly' => 'per quarter',
    'annual' || 'yearly' => 'per year',
    _ => period.isEmpty ? unknown : period.toLowerCase(),
  };

  /// Human label for a billing period name.
  String billingName(String period) => switch (period.toLowerCase()) {
    'monthly' => 'Monthly',
    'quarterly' => 'Quarterly',
    'annual' || 'yearly' => 'Annual',
    _ => period.isEmpty ? unknown : period,
  };

  /// Human label for a lifecycle status.
  String statusLabel(String status) => switch (status.toLowerCase()) {
    'active' => 'Active',
    'frozen' => 'Frozen',
    'cancelled' => 'Cancelled',
    'expired' => 'Expired',
    _ => status.isEmpty ? unknown : status,
  };

  /// Formats the freeze banner line.
  String frozenBanner(DateTime until) => 'Cover paused until ${date(until)}';

  static const List<String> _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
}
