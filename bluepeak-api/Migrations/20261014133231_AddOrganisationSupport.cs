
using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace bluepeak_api.Migrations
{
    public partial class AddOrganisationSupport : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create the Organisations table first.
            migrationBuilder.CreateTable(
                name: "Organisations",
                columns: table => new
                {
                    OrganisationId = table.Column<int>(
                        type: "int",
                        nullable: false)
                       .Annotation("MySql:ValueGenerationStrategy",
    MySqlValueGenerationStrategy.IdentityColumn),

                    Name = table.Column<string>(
                        type: "varchar(150)",
                        maxLength: 150,
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    OrganisationCode = table.Column<string>(
                        type: "varchar(100)",
                        maxLength: 100,
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    Address = table.Column<string>(
                        type: "varchar(200)",
                        maxLength: 200,
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    PhoneNumber = table.Column<string>(
                        type: "varchar(30)",
                        maxLength: 30,
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    Email = table.Column<string>(
                        type: "varchar(150)",
                        maxLength: 150,
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    LogoUrl = table.Column<string>(
                        type: "varchar(255)",
                        maxLength: 255,
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),

                    IsActive = table.Column<bool>(
                        type: "tinyint(1)",
                        nullable: false),

                    CreatedAt = table.Column<DateTime>(
                        type: "datetime(6)",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_Organisations",
                        x => x.OrganisationId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // 2. Insert Coldstone before assigning organisation IDs.
            migrationBuilder.InsertData(
                table: "Organisations",
                columns: new[]
                {
                    "OrganisationId",
                    "Name",
                    "OrganisationCode",
                    "Address",
                    "PhoneNumber",
                    "Email",
                    "LogoUrl",
                    "IsActive",
                    "CreatedAt"
                },
                values: new object[]
                {
                    1,
                    "Coldstone",
                    "COLDSTONE",
                    null,
                    null,
                    null,
                    null,
                    true,
                    new DateTime(
                        2026, 10, 14, 0, 0, 0, DateTimeKind.Utc)
                });

            // 3. Add nullable columns temporarily so existing records
            // can be assigned safely before the foreign keys are added.
            migrationBuilder.AddColumn<int>(
                name: "OrganisationId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrganisationId",
                table: "Products",
                type: "int",
                nullable: true);

            // 4. Assign every existing user and product to Coldstone.
            migrationBuilder.Sql(
                "UPDATE `Users` SET `OrganisationId` = 1;");

            migrationBuilder.Sql(
                "UPDATE `Products` SET `OrganisationId` = 1;");

            // 5. Make OrganisationId required after assigning existing rows.
            migrationBuilder.AlterColumn<int>(
                name: "OrganisationId",
                table: "Users",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrganisationId",
                table: "Products",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // 6. Add indexes.
            migrationBuilder.CreateIndex(
                name: "IX_Users_OrganisationId",
                table: "Users",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_OrganisationId",
                table: "Products",
                column: "OrganisationId");

            // 7. Add foreign keys only after all existing rows are assigned.
            migrationBuilder.AddForeignKey(
                name: "FK_Users_Organisations_OrganisationId",
                table: "Users",
                column: "OrganisationId",
                principalTable: "Organisations",
                principalColumn: "OrganisationId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Organisations_OrganisationId",
                table: "Products",
                column: "OrganisationId",
                principalTable: "Organisations",
                principalColumn: "OrganisationId",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Organisations_OrganisationId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Organisations_OrganisationId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Users_OrganisationId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Products_OrganisationId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "OrganisationId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OrganisationId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "Organisations");
        }
    }
}