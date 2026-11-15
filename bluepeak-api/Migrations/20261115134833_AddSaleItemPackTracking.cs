using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    public partial class AddSaleItemPackTracking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SaleItems
            migrationBuilder.AddColumn<string>(
                name: "SaleUnitType",
                table: "SaleItems",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "SingleUnit");

            migrationBuilder.AddColumn<int>(
                name: "UnitsPerPackAtSale",
                table: "SaleItems",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "SaleItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // RefundItems
            migrationBuilder.AddColumn<string>(
                name: "SaleUnitType",
                table: "RefundItems",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "SingleUnit");

            migrationBuilder.AddColumn<int>(
                name: "UnitsPerPackAtSale",
                table: "RefundItems",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "RefundItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Products
            migrationBuilder.AddColumn<decimal>(
                name: "SellingPricePerPack",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuantityInStock",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SaleUnitType",
                table: "SaleItems");

            migrationBuilder.DropColumn(
                name: "UnitsPerPackAtSale",
                table: "SaleItems");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "SaleItems");

            migrationBuilder.DropColumn(
                name: "SaleUnitType",
                table: "RefundItems");

            migrationBuilder.DropColumn(
                name: "UnitsPerPackAtSale",
                table: "RefundItems");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "RefundItems");

            migrationBuilder.DropColumn(
                name: "SellingPricePerPack",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "QuantityInStock",
                table: "Products");
        }
    }
}