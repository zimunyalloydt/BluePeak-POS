using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    /// <inheritdoc />
    public partial class SetSmartInventoryDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE Products
                SET ReorderLevel = 10
                WHERE ReorderLevel = 0;
            """);

            migrationBuilder.Sql("""
                UPDATE Products
                SET ReorderQuantity = 50
                WHERE ReorderQuantity = 0;
            """);

            migrationBuilder.Sql("""
                UPDATE Products
                SET SupplierLeadTimeDays = 3
                WHERE SupplierLeadTimeDays = 0;
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE Products
                SET ReorderLevel = 0
                WHERE ReorderLevel = 10;
            """);

            migrationBuilder.Sql("""
                UPDATE Products
                SET ReorderQuantity = 0
                WHERE ReorderQuantity = 50;
            """);

            migrationBuilder.Sql("""
                UPDATE Products
                SET SupplierLeadTimeDays = 0
                WHERE SupplierLeadTimeDays = 3;
            """);
        }
    }
}
