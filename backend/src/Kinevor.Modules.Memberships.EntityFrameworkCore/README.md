# Kinevor.Modules.Memberships.EntityFrameworkCore

EF Core persistence for the Kinevor memberships module. Register the context with
`AddDbContext<MembershipsDbContext>` and call
`AddMembershipsEntityFrameworkCore()` to bind repositories and the unit of work.
