using System.Text.Json;
using Kinevor.Modules.Memberships.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kinevor.Modules.Memberships.EntityFrameworkCore.Configurations;

/// <summary>EF Core mapping for <see cref="Membership"/>.</summary>
public sealed class MembershipConfiguration : IEntityTypeConfiguration<Membership>
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Configures table, keys, indexes, snapshots and concurrency.</summary>
    public void Configure(EntityTypeBuilder<Membership> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("Memberships");
        builder.HasKey(membership => membership.Id);
        builder.Property(membership => membership.MemberId).IsRequired();
        builder.Property(membership => membership.PlanId).IsRequired();
        builder.Property(membership => membership.PlanName).HasMaxLength(80).IsRequired();
        builder.Property(membership => membership.Tier).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(membership => membership.BillingPeriod).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(membership => membership.Price).HasPrecision(10, 2);
        builder.Property(membership => membership.Currency).HasMaxLength(3).IsRequired();

        var features = builder.Property(membership => membership.Features);
        features.HasConversion(
            value => JsonSerializer.Serialize(value, SerializerOptions),
            value => DeserializeFeatures(value));
        features.Metadata.SetValueComparer(new ValueComparer<IReadOnlyList<string>>(
            (left, right) => left != null && right != null && left.SequenceEqual(right),
            value => value.Aggregate(0, (hash, feature) => HashCode.Combine(hash, feature.GetHashCode())),
            value => value.ToArray()));
        features.IsRequired();

        builder.Property(membership => membership.StartDate).HasColumnType("TEXT");
        builder.Property(membership => membership.EndDate).HasColumnType("TEXT");
        builder.Property(membership => membership.FrozenFrom).HasColumnType("TEXT");
        builder.Property(membership => membership.FrozenUntil).HasColumnType("TEXT");
        builder.Property(membership => membership.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(membership => membership.Notes).HasMaxLength(500);
        builder.Property(membership => membership.FreezeReason).HasMaxLength(240);
        builder.Property(membership => membership.RowVersion).IsConcurrencyToken();

        builder.HasIndex(membership => membership.MemberId);
        builder.HasIndex(membership => new { membership.MemberId, membership.EndDate });
        builder.HasIndex(membership => membership.Status);
        builder.HasIndex(membership => membership.EndDate);
        builder.HasQueryFilter(membership => !membership.IsDeleted);
        builder.Ignore(membership => membership.DurationDays);
        builder.Ignore(membership => membership.DomainEvents);
    }

    private static IReadOnlyList<string> DeserializeFeatures(string json) =>
        JsonSerializer.Deserialize<List<string>>(json, SerializerOptions) ?? [];
}
