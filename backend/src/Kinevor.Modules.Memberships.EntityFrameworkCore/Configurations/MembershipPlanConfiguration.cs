using System.Text.Json;
using Kinevor.Modules.Memberships.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore.Configurations;

/// <summary>EF Core mapping for <see cref="MembershipPlan"/>.</summary>
public sealed class MembershipPlanConfiguration : IEntityTypeConfiguration<MembershipPlan>
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Configures table, keys, indexes and value conversions.</summary>
    public void Configure(EntityTypeBuilder<MembershipPlan> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("MembershipPlans");
        builder.HasKey(plan => plan.Id);
        builder.Property(plan => plan.Name).HasMaxLength(80).IsRequired();
        builder.Property(plan => plan.Description).HasMaxLength(500).IsRequired();
        builder.Property(plan => plan.Tier).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(plan => plan.BillingPeriod).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(plan => plan.Price).HasPrecision(10, 2);
        builder.Property(plan => plan.Currency).HasMaxLength(3).IsRequired();

        var features = builder.Property(plan => plan.Features);
        features.HasConversion(
            value => JsonSerializer.Serialize(value, SerializerOptions),
            value => DeserializeFeatures(value));
        features.Metadata.SetValueComparer(new ValueComparer<IReadOnlyList<string>>(
            (left, right) => left != null && right != null && left.SequenceEqual(right),
            value => value.Aggregate(0, (hash, feature) => HashCode.Combine(hash, feature.GetHashCode())),
            value => value.ToArray()));
        features.IsRequired();

        builder.HasIndex(plan => plan.IsActive);
        builder.HasIndex(plan => plan.Price);
        builder.HasQueryFilter(plan => !plan.IsDeleted);
        builder.Ignore(plan => plan.DurationDays);
        builder.Ignore(plan => plan.DomainEvents);
    }

    private static IReadOnlyList<string> DeserializeFeatures(string json) =>
        JsonSerializer.Deserialize<List<string>>(json, SerializerOptions) ?? [];
}
