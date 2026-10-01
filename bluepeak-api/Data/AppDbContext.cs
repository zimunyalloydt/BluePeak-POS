using Microsoft.EntityFrameworkCore;
using bluepeak_api.Models;

namespace bluepeak_api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();

public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();

    public DbSet<Message> Messages => Set<Message>();

public DbSet<RefundRequest> RefundRequests => Set<RefundRequest>();

    public DbSet<Sale> Sales => Set<Sale>();
public DbSet<SaleItem> SaleItems => Set<SaleItem>();

public DbSet<TaskItem> TaskItems => Set<TaskItem>();

public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();

public DbSet<Notification> Notifications => Set<Notification>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Sale>()
    .HasIndex(s => s.ClientSaleId)
    .IsUnique();

        modelBuilder.Entity<RefundRequest>()
    .HasOne(r => r.Sale)
    .WithMany()
    .HasForeignKey(r => r.SaleId);

modelBuilder.Entity<RefundRequest>()
    .HasOne(r => r.RequestedByUser)
    .WithMany()
    .HasForeignKey(r => r.RequestedByUserId)
    .OnDelete(DeleteBehavior.Restrict);

    modelBuilder.Entity<UserPermission>()
    .HasKey(x => new
    {
        x.UserId,
        x.PermissionId
    });

    modelBuilder.Entity<Permission>().HasData(

new Permission { PermissionId = 1, Name = "Sell Products", Description = "Can create sales" },

new Permission { PermissionId = 2, Name = "Refund Sales", Description = "Can refund completed sales" },

new Permission { PermissionId = 3, Name = "Manage Products", Description = "Can add/edit/delete products" },

new Permission { PermissionId = 4, Name = "Manage Categories", Description = "Can manage categories" },

new Permission { PermissionId = 5, Name = "Manage Users", Description = "Can create/edit users" },

new Permission { PermissionId = 6, Name = "View Reports", Description = "Can access reports" },

new Permission { PermissionId = 7, Name = "View Profit", Description = "Can see profit values" },

new Permission { PermissionId = 8, Name = "Manage Settings", Description = "Can change system settings" },

new Permission { PermissionId = 9, Name = "Void Sale", Description = "Can void a sale before completion" },

new Permission { PermissionId = 10, Name = "Apply Discount", Description = "Can apply discounts" }

);

modelBuilder.Entity<UserPermission>()
    .HasOne(x => x.User)
    .WithMany(x => x.UserPermissions)
    .HasForeignKey(x => x.UserId);

    modelBuilder.Entity<TaskItem>()
    .HasOne(t => t.CreatedByUser)
    .WithMany()
    .HasForeignKey(t => t.CreatedByUserId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<TaskAssignment>()
    .HasOne(a => a.TaskItem)
    .WithMany(t => t.Assignments)
    .HasForeignKey(a => a.TaskItemId);

modelBuilder.Entity<TaskAssignment>()
    .HasOne(a => a.User)
    .WithMany()
    .HasForeignKey(a => a.UserId);

modelBuilder.Entity<Notification>()
    .HasOne(n => n.User)
    .WithMany()
    .HasForeignKey(n => n.UserId);

modelBuilder.Entity<Message>()
    .HasOne(m => m.Sender)
    .WithMany()
    .HasForeignKey(m => m.SenderUserId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Message>()
    .HasOne(m => m.Receiver)
    .WithMany()
    .HasForeignKey(m => m.ReceiverUserId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<UserPermission>()
    .HasOne(x => x.Permission)
    .WithMany(x => x.UserPermissions)
    .HasForeignKey(x => x.PermissionId);

modelBuilder.Entity<RefundRequest>()
    .HasOne(r => r.ApprovedByUser)
    .WithMany()
    .HasForeignKey(r => r.ApprovedByUserId)
    .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Role>().HasData(
            new Role
{
    RoleId = 1,
    RoleName = "Admin",
    Description = "System Administrator",
    CreatedAt = new DateTime(2026, 1, 1)
},
            new Role
            {
                RoleId = 2,
                RoleName = "Manager",
                Description = "Store Manager",
                CreatedAt = new DateTime(2026, 1, 1)
            },
            new Role
            {
                RoleId = 3,
                RoleName = "Cashier",
                Description = "POS Cashier",
                CreatedAt = new DateTime(2026, 1, 1)
            }
        );
    }
}