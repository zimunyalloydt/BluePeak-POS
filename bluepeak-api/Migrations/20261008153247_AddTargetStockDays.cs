using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    public partial class AddTargetStockDays : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TargetStockDays",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 7);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetStockDays",
                table: "Products");
        }
    }
}