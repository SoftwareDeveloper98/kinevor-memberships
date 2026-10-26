using Kinevor.Platform.Application.Exceptions;
using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Memberships.Domain;

/// <summary>A purchasable membership plan and the benefits it grants.</summary>
public sealed class MembershipPlan : AggregateRoot
{
    private readonly List<string> _features = [];

    private MembershipPlan()
    {
    }

    /// <summary>Display name of the plan.</summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>Short marketing description.</summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>Membership tier granted by the plan.</summary>
    public MembershipTier Tier { get; private set; }

    /// <summary>Billing frequency of the plan.</summary>
    public BillingPeriod BillingPeriod { get; private set; }

    /// <summary>Price charged for one billing period.</summary>
    public decimal Price { get; private set; }

    /// <summary>ISO 4217 currency code.</summary>
    public string Currency { get; private set; } = string.Empty;

    /// <summary>Number of days covered by one billing period.</summary>
    public int DurationDays => BillingPeriods.ToDays(BillingPeriod);

    /// <summary>Benefits displayed on the plan catalogue.</summary>
    public IReadOnlyList<string> Features => _features.AsReadOnly();

    /// <summary>Whether the plan can be sold to new members.</summary>
    public bool IsActive { get; private set; }

    /// <summary>Creates a plan with validated catalogue details.</summary>
    /// <param name="name">Plan name.</param>
    /// <param name="description">Plan description.</param>
    /// <param name="tier">Granted membership tier.</param>
    /// <param name="billingPeriod">Billing frequency.</param>
    /// <param name="price">Price per period.</param>
    /// <param name="currency">ISO 4217 currency code.</param>
    /// <param name="features">Between one and eight benefit statements.</param>
    /// <param name="isActive">Whether the plan is immediately purchasable.</param>
    /// <param name="id">Optional deterministic identifier used by data seeding.</param>
    /// <returns>A new plan aggregate.</returns>
    /// <exception cref="DomainException">A supplied value violates catalogue rules.</exception>
    public static MembershipPlan Create(
        string name,
        string description,
        MembershipTier tier,
        BillingPeriod billingPeriod,
        decimal price,
        string currency,
        IEnumerable<string>? features,
        bool isActive = true,
        Guid? id = null)
    {
        var plan = new MembershipPlan();
        if (id.HasValue) plan.Id = id.Value;
        plan.Apply(name, description, tier, billingPeriod, price, currency, features, isActive);
        return plan;
    }

    /// <summary>Updates the catalogue details while preserving existing subscription snapshots.</summary>
    /// <param name="name">Plan name.</param>
    /// <param name="description">Plan description.</param>
    /// <param name="tier">Granted membership tier.</param>
    /// <param name="billingPeriod">Billing frequency.</param>
    /// <param name="price">Price per period.</param>
    /// <param name="currency">ISO 4217 currency code.</param>
    /// <param name="features">Between one and eight benefit statements.</param>
    /// <param name="isActive">Whether the plan is purchasable.</param>
    /// <exception cref="DomainException">A supplied value violates catalogue rules.</exception>
    public void Update(
        string name,
        string description,
        MembershipTier tier,
        BillingPeriod billingPeriod,
        decimal price,
        string currency,
        IEnumerable<string>? features,
        bool isActive)
    {
        Apply(name, description, tier, billingPeriod, price, currency, features, isActive);
    }

    /// <summary>Marks the plan as purchasable.</summary>
    public void Activate() => IsActive = true;

    /// <summary>Marks the plan as unavailable for new subscriptions.</summary>
    public void Deactivate() => IsActive = false;

    private void Apply(
        string name,
        string description,
        MembershipTier tier,
        BillingPeriod billingPeriod,
        decimal price,
        string currency,
        IEnumerable<string>? features,
        bool isActive)
    {
        var cleanName = RequireText(name, "Plan name", 3, 80);
        var cleanDescription = RequireText(description, "Plan description", 10, 500);

        if (!Enum.IsDefined(tier))
            throw new DomainException("Membership tier is not valid.");

        if (!Enum.IsDefined(billingPeriod))
            throw new DomainException("Billing period is not valid.");

        if (price <= 0 || price > 100_000)
            throw new DomainException("Plan price must be greater than zero and at most 100,000.");

        var cleanCurrency = RequireText(currency, "Currency", 3, 3).ToUpperInvariant();
        if (!cleanCurrency.All(char.IsAsciiLetterUpper))
            throw new DomainException("Currency must be a three-letter ISO 4217 code.");

        var cleanFeatures = NormalizeFeatures(features);

        Name = cleanName;
        Description = cleanDescription;
        Tier = tier;
        BillingPeriod = billingPeriod;
        Price = decimal.Round(price, 2, MidpointRounding.AwayFromZero);
        Currency = cleanCurrency;
        _features.Clear();
        _features.AddRange(cleanFeatures);
        IsActive = isActive;
    }

    private static List<string> NormalizeFeatures(IEnumerable<string>? features)
    {
        if (features is null)
            throw new DomainException("A plan must list between one and eight features.");

        var normalized = features
            .Where(feature => !string.IsNullOrWhiteSpace(feature))
            .Select(feature => feature.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count is < 1 or > 8)
            throw new DomainException("A plan must list between one and eight features.");

        if (normalized.Any(feature => feature.Length > 100))
            throw new DomainException("Plan features cannot exceed 100 characters.");

        return normalized;
    }

    private static string RequireText(string value, string field, int minimum, int maximum)
    {
        var clean = value?.Trim() ?? string.Empty;
        if (clean.Length < minimum || clean.Length > maximum)
            throw new DomainException($"{field} must be between {minimum} and {maximum} characters.");

        return clean;
    }
}
