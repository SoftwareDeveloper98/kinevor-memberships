namespace Kinevor.Modules.Memberships.Domain;

/// <summary>Billing frequency of a membership plan.</summary>
public enum BillingPeriod
{
    /// <summary>Billed every month.</summary>
    Monthly = 0,

    /// <summary>Billed every three months.</summary>
    Quarterly = 1,

    /// <summary>Billed every twelve months.</summary>
    Annual = 2,
}
