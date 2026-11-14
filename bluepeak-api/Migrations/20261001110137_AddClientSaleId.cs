using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    public partial class AddClientSaleId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create ClientSaleId for fresh database installations.
            migrationBuilder.AddColumn<string>(
                name: "ClientSaleId",
                table: "Sales",
                type: "varchar(255)",
                nullable: true);

            // Assign unique identifiers to existing sales.
            migrationBuilder.Sql(
                """
                UPDATE Sales
                SET ClientSaleId = CONCAT('legacy-', SaleId)
                WHERE ClientSaleId IS NULL OR ClientSaleId = '';
                """);

            // Enforce non-nullable ClientSaleId.
            migrationBuilder.AlterColumn<string>(
                name: "ClientSaleId",
                table: "Sales",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldNullable: true);

            // Create globally unique index.
            // A later migration changes this to organisation-specific uniqueness.
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