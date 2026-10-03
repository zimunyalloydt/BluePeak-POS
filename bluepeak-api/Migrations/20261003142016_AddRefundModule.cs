using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Refunds",
                columns: table => new
                {
                    RefundId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RefundRequestId = table.Column<int>(type: "int", nullable: false),
                    SaleId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProcessedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.RefundId);
                    table.ForeignKey(
                        name: "FK_Refunds_RefundRequests_RefundRequestId",
                        column: x => x.RefundRequestId,
                        principalTable: "RefundRequests",
                        principalColumn: "RefundRequestId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Refunds_Sales_SaleId",
                        column: x => x.SaleId,
                        principalTable: "Sales",
                        principalColumn: "SaleId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Refunds_Users_ProcessedByUserId",
                        column: x => x.ProcessedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RefundItems",
                columns: table => new
                {
                    RefundItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RefundId = table.Column<int>(type: "int", nullable: false),
                    SaleItemId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundItems", x => x.RefundItemId);
                    table.ForeignKey(
                        name: "FK_RefundItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefundItems_Refunds_RefundId",
                        column: x => x.RefundId,
                        principalTable: "Refunds",
                        principalColumn: "RefundId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RefundItems_SaleItems_SaleItemId",
                        column: x => x.SaleItemId,
                        principalTable: "SaleItems",
                        principalColumn: "SaleItemId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_RefundItems_ProductId",
                table: "RefundItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_RefundItems_RefundId",
                table: "RefundItems",
                column: "RefundId");

            migrationBuilder.CreateIndex(
                name: "IX_RefundItems_SaleItemId",
                table: "RefundItems",
                column: "SaleItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_ProcessedByUserId",
                table: "Refunds",
                column: "ProcessedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_RefundRequestId",
                table: "Refunds",
                column: "RefundRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_SaleId",
                table: "Refunds",
                column: "SaleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefundItems");

            migrationBuilder.DropTable(
                name: "Refunds");
        }
    }
}
