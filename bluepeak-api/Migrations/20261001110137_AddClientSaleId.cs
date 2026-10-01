using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    public partial class AddClientSaleId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The ClientSaleId column was already added during
            // the first partially-applied migration attempt.

            // Give existing sales unique IDs.
            migrationBuilder.Sql(
                """
                UPDATE Sales
                SET ClientSaleId = CONCAT('legacy-', SaleId)
                WHERE ClientSaleId = '';
                """);

            // Create the unique index.
            migrationBuilder.CreateIndex(
                name: "IX_Sales_ClientSaleId",
                table: "Sales",
                column: "ClientSaleId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sales_ClientSaleId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientSaleId",
                table: "Sales");
        }
    }
}