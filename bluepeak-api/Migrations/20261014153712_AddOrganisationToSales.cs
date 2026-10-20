using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
public partial class AddOrganisationToSales : Migration
{
protected override void Up(MigrationBuilder migrationBuilder)
{
// Add the column temporarily as nullable so existing sales can be migrated safely.
migrationBuilder.AddColumn<int>(
name: "OrganisationId",
table: "Sales",
type: "int",
nullable: true);

        // Preserve each sale's organisation by looking up the organisation
        // belonging to the user who made that sale.
        migrationBuilder.Sql(@"
            UPDATE Sales s
            INNER JOIN Users u ON s.UserId = u.UserId
            SET s.OrganisationId = u.OrganisationId;
        ");
        
        // Remove the old globally unique indexes.
        migrationBuilder.DropIndex(
            name: "IX_Sales_ClientSaleId",
            table: "Sales");
        migrationBuilder.DropIndex(
            name: "IX_Sales_ReceiptToken",
            table: "Sales");
        // Make OrganisationId mandatory after backfilling existing sales.
        migrationBuilder.AlterColumn<int>(
            name: "OrganisationId",
            table: "Sales",
            type: "int",
            nullable: false,
            oldClrType: typeof(int),
            oldType: "int",
            oldNullable: true);
        // Enforce uniqueness within each organisation.
        migrationBuilder.CreateIndex(
            name: "IX_Sales_OrganisationId_ClientSaleId",
            table: "Sales",
            columns: new[] { "OrganisationId", "ClientSaleId" },
            unique: true);
        migrationBuilder.CreateIndex(
            name: "IX_Sales_OrganisationId_ReceiptToken",
            table: "Sales",
            columns: new[] { "OrganisationId", "ReceiptToken" },
            unique: true);
        migrationBuilder.AddForeignKey(
            name: "FK_Sales_Organisations_OrganisationId",
            table: "Sales",
            column: "OrganisationId",
            principalTable: "Organisations",
            principalColumn: "OrganisationId",
            onDelete: ReferentialAction.Cascade);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Sales_Organisations_OrganisationId",
            table: "Sales");
        migrationBuilder.DropIndex(
            name: "IX_Sales_OrganisationId_ClientSaleId",
            table: "Sales");
        migrationBuilder.DropIndex(
            name: "IX_Sales_OrganisationId_ReceiptToken",
            table: "Sales");
        migrationBuilder.DropColumn(
            name: "OrganisationId",
            table: "Sales");
        migrationBuilder.CreateIndex(
            name: "IX_Sales_ClientSaleId",
            table: "Sales",
            column: "ClientSaleId",
            unique: true);
        migrationBuilder.CreateIndex(
            name: "IX_Sales_ReceiptToken",
            table: "Sales",
            column: "ReceiptToken",
            unique: true);
    }
}

}