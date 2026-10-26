namespace Kinevor.Modules.Memberships.Domain;

/// <summary>Persisted lifecycle state of a membership subscription.</summary>
public enum MembershipStatus
{
    /// <summary>The membership is running.</summary>
    Active = 0,

    /// <summary>The membership is paused for a bounded period.</summary>
    Frozen = 1,

    /// <summary>The membership was cancelled by the member or staff.</summary>
    Cancelled = 2,

    /// <summary>The paid period elapsed without renewal.</summary>
    Expired = 3,
}
