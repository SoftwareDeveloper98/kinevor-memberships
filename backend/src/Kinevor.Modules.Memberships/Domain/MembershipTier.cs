namespace Kinevor.Modules.Memberships.Domain;

/// <summary>Tier of a membership plan.</summary>
public enum MembershipTier
{
    /// <summary>Entry-level access.</summary>
    Basic = 0,

    /// <summary>Mid-level access with additional services.</summary>
    Standard = 1,

    /// <summary>Full club access.</summary>
    Premium = 2,

    /// <summary>Highest tier with concierge and partner benefits.</summary>
    Elite = 3,
}
