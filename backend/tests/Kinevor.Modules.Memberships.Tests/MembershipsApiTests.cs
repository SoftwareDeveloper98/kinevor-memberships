using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kinevor.Modules.Memberships.DemoApi.Data;

namespace Kinevor.Modules.Memberships.Tests;

/// <summary>HTTP contract tests against the standalone memberships host.</summary>
public sealed class MembershipsApiTests
{
    private const string FoundationPlanId = "30000000-0000-0000-0000-000000000001";
    private const string PerformancePlanId = "30000000-0000-0000-0000-000000000002";
    private const string CorporatePlanId = "30000000-0000-0000-0000-000000000004";
    private const string MayaMembershipId = "40000000-0000-0000-0000-000000000001";
    private const string SofiaMembershipId = "40000000-0000-0000-0000-000000000004";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task Health_is_anonymous()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Catalogue_returns_active_plans_to_members()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = Client(factory, "Member");

        var plans = await GetData<IReadOnlyList<PlanView>>(client, "/api/v1/plans");

        Assert.Equal(3, plans.Count);
        Assert.Equal("Foundation", plans[0].Name);
        Assert.Equal("Monthly", plans[0].BillingPeriod);
        Assert.Equal(30, plans[0].DurationDays);
        Assert.Equal(39m, plans[0].Price);
        Assert.Equal("GBP", plans[0].Currency);
        Assert.NotEmpty(plans[0].Features);

        var detail = await GetData<PlanView>(client, $"/api/v1/plans/{PerformancePlanId}");
        Assert.Equal("Performance", detail.Name);
        Assert.Equal("Premium", detail.Tier);
    }

    [Fact]
    public async Task Inactive_plans_are_hidden_from_members_and_visible_to_staff()
    {
        using var factory = new TestWebApplicationFactory();
        using var member = Client(factory, "Member");
        using var staff = Client(factory);

        var forbidden = await member.GetAsync("/api/v1/plans?includeInactive=true");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var plans = await GetData<IReadOnlyList<PlanView>>(
            staff, "/api/v1/plans?includeInactive=true");
        Assert.Equal(4, plans.Count);
        Assert.Contains(plans, plan => plan.Name == "Corporate" && !plan.IsActive);
    }

    [Fact]
    public async Task Staff_can_create_update_and_deactivate_a_plan()
    {
        using var factory = new TestWebApplicationFactory();
        using var staff = Client(factory);

        var createResponse = await staff.PostAsJsonAsync("/api/v1/plans", new
        {
            name = "Student",
            description = "A discounted membership for verified students.",
            tier = "Standard",
            billingPeriod = "Monthly",
            price = 29m,
            currency = "GBP",
            features = new[] { "Off-peak gym access", "Student community events" },
            isActive = true,
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await ReadData<PlanView>(createResponse);
        Assert.Equal("Student", created.Name);
        Assert.True(created.IsActive);

        var updateResponse = await staff.PatchAsJsonAsync($"/api/v1/plans/{created.Id}", new
        {
            name = "Student Plus",
            description = "A discounted membership with flexible student access.",
            tier = "Standard",
            billingPeriod = "Monthly",
            price = 32m,
            currency = "GBP",
            features = new[] { "Flexible gym access", "Student community events" },
            isActive = false,
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await ReadData<PlanView>(updateResponse);
        Assert.Equal("Student Plus", updated.Name);
        Assert.Equal(32m, updated.Price);
        Assert.False(updated.IsActive);

        var memberPlans = await GetData<IReadOnlyList<PlanView>>(
            Client(factory, "Member"), "/api/v1/plans");
        Assert.DoesNotContain(memberPlans, plan => plan.Id == created.Id);
    }

    [Fact]
    public async Task Staff_membership_search_filters_by_member_and_status()
    {
        using var factory = new TestWebApplicationFactory();
        using var staff = Client(factory);
        using var member = Client(factory, "Member");

        var all = await GetData<PagedResponse<MembershipSummaryView>>(
            staff, "/api/v1/memberships?page=1&pageSize=20");
        Assert.Equal(6, all.TotalCount);

        var frozen = await GetData<PagedResponse<MembershipSummaryView>>(
            staff, "/api/v1/memberships?status=Frozen");
        Assert.Single(frozen.Items);
        Assert.Equal(DemoDataSeeder.SofiaMemberId, frozen.Items[0].MemberId);
        Assert.Equal("Frozen", frozen.Items[0].Status);

        var maya = await GetData<PagedResponse<MembershipSummaryView>>(
            staff, $"/api/v1/memberships?memberId={DemoDataSeeder.MayaMemberId}");
        Assert.Equal(2, maya.TotalCount);
        Assert.Contains(maya.Items, item => item.Status == "Cancelled");

        var firstPage = await GetData<PagedResponse<MembershipSummaryView>>(
            staff, "/api/v1/memberships?page=1&pageSize=2");
        Assert.Equal(2, firstPage.Items.Count);
        Assert.Equal(6, firstPage.TotalCount);

        var forbidden = await member.GetAsync("/api/v1/memberships");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task Self_service_returns_maya_current_membership_and_history()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = Client(factory, "Member", DemoDataSeeder.MayaMemberId);

        var current = await GetData<MembershipDetailView>(client, "/api/v1/me/memberships/current");

        Assert.Equal("Performance", current.PlanName);
        Assert.Equal("Active", current.Status);
        Assert.Equal("Premium", current.Tier);
        Assert.Equal(129m, current.Price);
        Assert.True(current.DaysRemaining > 0);
        Assert.Contains("Unlimited studio classes", current.Features);
        Assert.True(current.AutoRenew);

        var history = await GetData<IReadOnlyList<MembershipSummaryView>>(
            client, "/api/v1/me/memberships");
        Assert.Equal(2, history.Count);
        Assert.Equal(current.Id, history[0].Id);
        Assert.Contains(history, item => item.Status == "Cancelled");
    }

    [Fact]
    public async Task Self_detail_hides_another_members_membership()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = Client(factory, "Member", DemoDataSeeder.MayaMemberId);

        var own = await GetData<MembershipDetailView>(
            client, $"/api/v1/me/memberships/{MayaMembershipId}");
        Assert.Equal("Performance", own.PlanName);

        var hidden = await client.GetAsync($"/api/v1/me/memberships/{SofiaMembershipId}");
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
    }

    [Fact]
    public async Task Member_can_start_freeze_resume_renew_and_cancel_membership()
    {
        using var factory = new TestWebApplicationFactory();
        var memberId = Guid.NewGuid();
        using var client = Client(factory, "Member", memberId);

        var startResponse = await client.PostAsJsonAsync("/api/v1/me/memberships", new
        {
            planId = FoundationPlanId,
            autoRenew = true,
        });
        Assert.Equal(HttpStatusCode.Created, startResponse.StatusCode);
        var created = await ReadData<CreatedView>(startResponse);

        var current = await GetData<MembershipDetailView>(client, "/api/v1/me/memberships/current");
        Assert.Equal(created.Id, current.Id);
        Assert.Equal("Active", current.Status);
        Assert.Equal(30, current.DaysRemaining);

        var freezeResponse = await client.PostAsJsonAsync(
            $"/api/v1/me/memberships/{created.Id}/freeze",
            new { until = DateTime.UtcNow.AddDays(14), reason = "Travel" });
        Assert.Equal(HttpStatusCode.OK, freezeResponse.StatusCode);
        var frozen = await ReadData<MembershipDetailView>(freezeResponse);
        Assert.Equal("Frozen", frozen.Status);
        Assert.Equal("Travel", frozen.FreezeReason);
        Assert.NotNull(frozen.FrozenUntil);

        var stillCurrent = await GetData<MembershipDetailView>(
            client, "/api/v1/me/memberships/current");
        Assert.Equal("Frozen", stillCurrent.Status);

        var resumeResponse = await client.PostAsJsonAsync(
            $"/api/v1/me/memberships/{created.Id}/resume", new { });
        Assert.Equal(HttpStatusCode.OK, resumeResponse.StatusCode);
        var resumed = await ReadData<MembershipDetailView>(resumeResponse);
        Assert.Equal("Active", resumed.Status);
        Assert.Null(resumed.FrozenUntil);

        var renewResponse = await client.PostAsJsonAsync(
            $"/api/v1/me/memberships/{created.Id}/renew", new { periods = 2 });
        Assert.Equal(HttpStatusCode.OK, renewResponse.StatusCode);
        var renewed = await ReadData<MembershipDetailView>(renewResponse);
        Assert.True(renewed.EndDate > resumed.EndDate);

        var cancelResponse = await client.PostAsJsonAsync(
            $"/api/v1/me/memberships/{created.Id}/cancel", new { });
        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);
        var cancelled = await ReadData<MembershipDetailView>(cancelResponse);
        Assert.Equal("Cancelled", cancelled.Status);

        var currentAfterCancel = await GetData<MembershipDetailView?>(
            client, "/api/v1/me/memberships/current");
        Assert.Null(currentAfterCancel);

        var renewCancelled = await client.PostAsJsonAsync(
            $"/api/v1/me/memberships/{created.Id}/renew", new { periods = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, renewCancelled.StatusCode);
    }

    [Fact]
    public async Task Start_rejects_overlap_and_inactive_plans()
    {
        using var factory = new TestWebApplicationFactory();
        using var staff = Client(factory);
        var otherMember = Guid.NewGuid();

        var overlap = await staff.PostAsJsonAsync("/api/v1/memberships", new
        {
            memberId = DemoDataSeeder.MayaMemberId,
            planId = PerformancePlanId,
            autoRenew = false,
        });
        Assert.Equal(HttpStatusCode.Conflict, overlap.StatusCode);

        var inactive = await staff.PostAsJsonAsync("/api/v1/memberships", new
        {
            memberId = otherMember,
            planId = CorporatePlanId,
            autoRenew = false,
        });
        Assert.Equal(HttpStatusCode.BadRequest, inactive.StatusCode);
    }

    [Fact]
    public async Task Endpoints_require_authentication()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var plans = await client.GetAsync("/api/v1/plans");
        var memberships = await client.GetAsync("/api/v1/memberships");

        Assert.Equal(HttpStatusCode.Unauthorized, plans.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, memberships.StatusCode);
    }

    private static HttpClient Client(
        TestWebApplicationFactory factory,
        string role = "Staff",
        Guid? memberId = null)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Demo-Role", role);
        client.DefaultRequestHeaders.Add(
            "X-Demo-Member",
            (memberId ?? DemoDataSeeder.MayaMemberId).ToString());
        return client;
    }

    private static async Task<T> GetData<T>(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadData<T>(response);
    }

    private static async Task<T> ReadData<T>(HttpResponseMessage response)
    {
        var envelope = await response.Content.ReadFromJsonAsync<Envelope<T>>(JsonOptions);
        Assert.NotNull(envelope);
        Assert.True(envelope.Success);
        return envelope.Data!;
    }

    private sealed record Envelope<T>(bool Success, T? Data, string? Message);

    private sealed record PagedResponse<T>(
        IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

    private sealed record PlanView(
        Guid Id,
        string Name,
        string Description,
        string Tier,
        string BillingPeriod,
        int DurationDays,
        decimal Price,
        string Currency,
        IReadOnlyList<string> Features,
        bool IsActive);

    private sealed record MembershipSummaryView(
        Guid Id,
        Guid MemberId,
        string PlanName,
        string Status,
        int DaysRemaining);

    private sealed record MembershipDetailView(
        Guid Id,
        Guid MemberId,
        string PlanName,
        string Tier,
        string BillingPeriod,
        decimal Price,
        IReadOnlyList<string> Features,
        DateTime StartDate,
        DateTime EndDate,
        string Status,
        int DaysRemaining,
        bool AutoRenew,
        string? FreezeReason,
        DateTime? FrozenUntil);

    private sealed record CreatedView(Guid Id);
}
