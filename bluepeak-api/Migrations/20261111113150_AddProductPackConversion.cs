using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductPackConversion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "CostPrice",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<string>(
                name: "StockType",
                table: "Products",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "SingleUnit")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "UnitsPerPack",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StockType",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UnitsPerPack",
                table: "Products");

            migrationBuilder.AlterColumn<decimal>(
                name: "CostPrice",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }
    }
}
