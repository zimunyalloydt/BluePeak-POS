using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bluepeak_api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationProductCodeUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)

{

    migrationBuilder.CreateIndex(

        name: "IX_Products_OrganisationId_ProductCode",

        table: "Products",

        columns: new[] { "OrganisationId", "ProductCode" },

        unique: true);

}
     

        /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)

{

    migrationBuilder.DropIndex(

        name: "IX_Products_OrganisationId_ProductCode",

        table: "Products");

            migrationBuilder.CreateIndex(
                name: "IX_Products_OrganisationId",
                table: "Products",
                column: "OrganisationId");
        }
    }
}
