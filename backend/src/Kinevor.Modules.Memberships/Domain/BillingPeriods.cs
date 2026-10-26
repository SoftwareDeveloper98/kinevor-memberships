namespace Kinevor.Modules.Memberships.Domain;

/// <summary>Duration rules shared by plans and memberships.</summary>
public static class BillingPeriods
{
    /// <summary>Returns the number of days covered by one billing period.</summary>
    /// <param name="period">Billing period to convert.</param>
    /// <returns>Thirty, ninety or three hundred and sixty-five days.</returns>
    /// <exception cref="ArgumentOutOfRangeException">The period is not defined.</exception>
    public static int ToDays(BillingPeriod period) => period switch
    {
        BillingPeriod.Monthly => 30,
        BillingPeriod.Quarterly => 90,
        BillingPeriod.Annual => 365,
        _ => throw new ArgumentOutOfRangeException(nameof(period), period, "Unknown billing period."),
    };
}
