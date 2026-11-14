CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Categories` (
    `CategoryId` int NOT NULL AUTO_INCREMENT,
    `CategoryName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(255) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Categories` PRIMARY KEY (`CategoryId`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Roles` (
    `RoleId` int NOT NULL AUTO_INCREMENT,
    `RoleName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Roles` PRIMARY KEY (`RoleId`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Products` (
    `ProductId` int NOT NULL AUTO_INCREMENT,
    `ProductCode` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `ProductName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Barcode` varchar(100) CHARACTER SET utf8mb4 NULL,
    `SellingPrice` decimal(18,2) NOT NULL,
    `CostPrice` decimal(18,2) NOT NULL,
    `ImageUrl` longtext CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `CategoryId` int NOT NULL,
    CONSTRAINT `PK_Products` PRIMARY KEY (`ProductId`),
    CONSTRAINT `FK_Products_Categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `Categories` (`CategoryId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Users` (
    `UserId` int NOT NULL AUTO_INCREMENT,
    `FirstName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `LastName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Username` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Phone` varchar(20) CHARACTER SET utf8mb4 NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `RoleId` int NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`UserId`),
    CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`RoleId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Sales` (
    `SaleId` int NOT NULL AUTO_INCREMENT,
    `SaleDate` datetime(6) NOT NULL,
    `Subtotal` decimal(65,30) NOT NULL,
    `Vat` decimal(65,30) NOT NULL,
    `Total` decimal(65,30) NOT NULL,
    `PaymentMethod` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AmountPaid` decimal(65,30) NOT NULL,
    `ChangeGiven` decimal(65,30) NOT NULL,
    `UserId` int NOT NULL,
    CONSTRAINT `PK_Sales` PRIMARY KEY (`SaleId`),
    CONSTRAINT `FK_Sales_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SaleItems` (
    `SaleItemId` int NOT NULL AUTO_INCREMENT,
    `SaleId` int NOT NULL,
    `ProductId` int NOT NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(65,30) NOT NULL,
    `Total` decimal(65,30) NOT NULL,
    CONSTRAINT `PK_SaleItems` PRIMARY KEY (`SaleItemId`),
    CONSTRAINT `FK_SaleItems_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `Products` (`ProductId`) ON DELETE CASCADE,
    CONSTRAINT `FK_SaleItems_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`SaleId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

INSERT INTO `Roles` (`RoleId`, `CreatedAt`, `Description`, `RoleName`)
VALUES (1, TIMESTAMP '2026-01-01 00:00:00', 'System Administrator', 'Admin'),
(2, TIMESTAMP '2026-01-01 00:00:00', 'Store Manager', 'Manager'),
(3, TIMESTAMP '2026-01-01 00:00:00', 'POS Cashier', 'Cashier');

CREATE INDEX `IX_Products_CategoryId` ON `Products` (`CategoryId`);

CREATE INDEX `IX_SaleItems_ProductId` ON `SaleItems` (`ProductId`);

CREATE INDEX `IX_SaleItems_SaleId` ON `SaleItems` (`SaleId`);

CREATE INDEX `IX_Sales_UserId` ON `Sales` (`UserId`);

CREATE INDEX `IX_Users_RoleId` ON `Users` (`RoleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260714124339_InitialCreate', '9.0.9');

CREATE TABLE `RefundRequests` (
    `RefundRequestId` int NOT NULL AUTO_INCREMENT,
    `SaleId` int NOT NULL,
    `RequestedByUserId` int NOT NULL,
    `ApprovedByUserId` int NULL,
    `Reason` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Notes` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `RequestedAt` datetime(6) NOT NULL,
    `ApprovedAt` datetime(6) NULL,
    `CompletedAt` datetime(6) NULL,
    CONSTRAINT `PK_RefundRequests` PRIMARY KEY (`RefundRequestId`),
    CONSTRAINT `FK_RefundRequests_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`SaleId`) ON DELETE CASCADE,
    CONSTRAINT `FK_RefundRequests_Users_ApprovedByUserId` FOREIGN KEY (`ApprovedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_RefundRequests_Users_RequestedByUserId` FOREIGN KEY (`RequestedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_RefundRequests_ApprovedByUserId` ON `RefundRequests` (`ApprovedByUserId`);

CREATE INDEX `IX_RefundRequests_RequestedByUserId` ON `RefundRequests` (`RequestedByUserId`);

CREATE INDEX `IX_RefundRequests_SaleId` ON `RefundRequests` (`SaleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260714143336_AddRefundRequests', '9.0.9');

CREATE TABLE `Permissions` (
    `PermissionId` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Permissions` PRIMARY KEY (`PermissionId`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `UserPermissions` (
    `UserId` int NOT NULL,
    `PermissionId` int NOT NULL,
    CONSTRAINT `PK_UserPermissions` PRIMARY KEY (`UserId`, `PermissionId`),
    CONSTRAINT `FK_UserPermissions_Permissions_PermissionId` FOREIGN KEY (`PermissionId`) REFERENCES `Permissions` (`PermissionId`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserPermissions_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

INSERT INTO `Permissions` (`PermissionId`, `Description`, `Name`)
VALUES (1, 'Can create sales', 'Sell Products'),
(2, 'Can refund completed sales', 'Refund Sales'),
(3, 'Can add/edit/delete products', 'Manage Products'),
(4, 'Can manage categories', 'Manage Categories'),
(5, 'Can create/edit users', 'Manage Users'),
(6, 'Can access reports', 'View Reports'),
(7, 'Can see profit values', 'View Profit'),
(8, 'Can change system settings', 'Manage Settings'),
(9, 'Can void a sale before completion', 'Void Sale'),
(10, 'Can apply discounts', 'Apply Discount');

CREATE INDEX `IX_UserPermissions_PermissionId` ON `UserPermissions` (`PermissionId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260717184615_AddUserPermissions', '9.0.9');

CREATE TABLE `Messages` (
    `MessageId` int NOT NULL AUTO_INCREMENT,
    `SenderId` int NOT NULL,
    `ReceiverId` int NOT NULL,
    `Text` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsRead` tinyint(1) NOT NULL,
    `SentAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Messages` PRIMARY KEY (`MessageId`),
    CONSTRAINT `FK_Messages_Users_ReceiverId` FOREIGN KEY (`ReceiverId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Messages_Users_SenderId` FOREIGN KEY (`SenderId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `Notifications` (
    `NotificationId` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Message` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Type` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsRead` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Notifications` PRIMARY KEY (`NotificationId`),
    CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `TaskItems` (
    `TaskItemId` int NOT NULL AUTO_INCREMENT,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Priority` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `DueDate` datetime(6) NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedByUserId` int NOT NULL,
    CONSTRAINT `PK_TaskItems` PRIMARY KEY (`TaskItemId`),
    CONSTRAINT `FK_TaskItems_Users_CreatedByUserId` FOREIGN KEY (`CreatedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `TaskAssignments` (
    `TaskAssignmentId` int NOT NULL AUTO_INCREMENT,
    `TaskItemId` int NOT NULL,
    `UserId` int NOT NULL,
    `IsRead` tinyint(1) NOT NULL,
    `IsCompleted` tinyint(1) NOT NULL,
    `ReadAt` datetime(6) NULL,
    `CompletedAt` datetime(6) NULL,
    CONSTRAINT `PK_TaskAssignments` PRIMARY KEY (`TaskAssignmentId`),
    CONSTRAINT `FK_TaskAssignments_TaskItems_TaskItemId` FOREIGN KEY (`TaskItemId`) REFERENCES `TaskItems` (`TaskItemId`) ON DELETE CASCADE,
    CONSTRAINT `FK_TaskAssignments_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Messages_ReceiverId` ON `Messages` (`ReceiverId`);

CREATE INDEX `IX_Messages_SenderId` ON `Messages` (`SenderId`);

CREATE INDEX `IX_Notifications_UserId` ON `Notifications` (`UserId`);

CREATE INDEX `IX_TaskAssignments_TaskItemId` ON `TaskAssignments` (`TaskItemId`);

CREATE INDEX `IX_TaskAssignments_UserId` ON `TaskAssignments` (`UserId`);

CREATE INDEX `IX_TaskItems_CreatedByUserId` ON `TaskItems` (`CreatedByUserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260718141100_AddCommunicationModule', '9.0.9');

ALTER TABLE `Sales` ADD `CustomerName` longtext CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260722161636_AddCustomerNameToSale', '9.0.9');

ALTER TABLE `Messages` DROP FOREIGN KEY `FK_Messages_Users_ReceiverId`;

ALTER TABLE `Messages` DROP FOREIGN KEY `FK_Messages_Users_SenderId`;

ALTER TABLE `Messages` RENAME COLUMN `SenderId` TO `SenderUserId`;

ALTER TABLE `Messages` RENAME COLUMN `ReceiverId` TO `ReceiverUserId`;

ALTER TABLE `Messages` RENAME INDEX `IX_Messages_SenderId` TO `IX_Messages_SenderUserId`;

ALTER TABLE `Messages` RENAME INDEX `IX_Messages_ReceiverId` TO `IX_Messages_ReceiverUserId`;

ALTER TABLE `Messages` MODIFY COLUMN `Text` varchar(1000) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Messages` ADD `ReadAt` datetime(6) NULL;

ALTER TABLE `Messages` ADD CONSTRAINT `FK_Messages_Users_ReceiverUserId` FOREIGN KEY (`ReceiverUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT;

ALTER TABLE `Messages` ADD CONSTRAINT `FK_Messages_Users_SenderUserId` FOREIGN KEY (`SenderUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260722174150_AddMessages', '9.0.9');

UPDATE Sales
SET ClientSaleId = CONCAT('legacy-', SaleId)
WHERE ClientSaleId = '';

CREATE UNIQUE INDEX `IX_Sales_ClientSaleId` ON `Sales` (`ClientSaleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261001110137_AddClientSaleId', '9.0.9');

CREATE TABLE `Refunds` (
    `RefundId` int NOT NULL AUTO_INCREMENT,
    `RefundRequestId` int NOT NULL,
    `SaleId` int NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `ProcessedByUserId` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Refunds` PRIMARY KEY (`RefundId`),
    CONSTRAINT `FK_Refunds_RefundRequests_RefundRequestId` FOREIGN KEY (`RefundRequestId`) REFERENCES `RefundRequests` (`RefundRequestId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Refunds_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`SaleId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Refunds_Users_ProcessedByUserId` FOREIGN KEY (`ProcessedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `RefundItems` (
    `RefundItemId` int NOT NULL AUTO_INCREMENT,
    `RefundId` int NOT NULL,
    `SaleItemId` int NOT NULL,
    `ProductId` int NOT NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(18,2) NOT NULL,
    `Total` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_RefundItems` PRIMARY KEY (`RefundItemId`),
    CONSTRAINT `FK_RefundItems_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `Products` (`ProductId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_RefundItems_Refunds_RefundId` FOREIGN KEY (`RefundId`) REFERENCES `Refunds` (`RefundId`) ON DELETE CASCADE,
    CONSTRAINT `FK_RefundItems_SaleItems_SaleItemId` FOREIGN KEY (`SaleItemId`) REFERENCES `SaleItems` (`SaleItemId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_RefundItems_ProductId` ON `RefundItems` (`ProductId`);

CREATE INDEX `IX_RefundItems_RefundId` ON `RefundItems` (`RefundId`);

CREATE INDEX `IX_RefundItems_SaleItemId` ON `RefundItems` (`SaleItemId`);

CREATE INDEX `IX_Refunds_ProcessedByUserId` ON `Refunds` (`ProcessedByUserId`);

CREATE INDEX `IX_Refunds_RefundRequestId` ON `Refunds` (`RefundRequestId`);

CREATE INDEX `IX_Refunds_SaleId` ON `Refunds` (`SaleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261003142016_AddRefundModule', '9.0.9');

ALTER TABLE `Products` ADD `ReorderLevel` int NOT NULL DEFAULT 0;

ALTER TABLE `Products` ADD `ReorderQuantity` int NOT NULL DEFAULT 0;

ALTER TABLE `Products` ADD `SupplierLeadTimeDays` int NOT NULL DEFAULT 0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261008131516_AddSmartInventoryFields', '9.0.9');

    UPDATE Products
    SET ReorderLevel = 10
    WHERE ReorderLevel = 0;

    UPDATE Products
    SET ReorderQuantity = 50
    WHERE ReorderQuantity = 0;

    UPDATE Products
    SET SupplierLeadTimeDays = 3
    WHERE SupplierLeadTimeDays = 0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261008135139_SetSmartInventoryDefaults', '9.0.9');

ALTER TABLE `Products` ADD `TargetStockDays` int NOT NULL DEFAULT 7;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261008153247_AddTargetStockDays', '9.0.9');

ALTER TABLE `Sales` ADD `ReceiptToken` varchar(255) CHARACTER SET utf8mb4 NULL;

CREATE UNIQUE INDEX `IX_Sales_ReceiptToken` ON `Sales` (`ReceiptToken`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261013072510_AddReceiptToken', '9.0.9');

CREATE TABLE `Organisations` (
    `OrganisationId` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `OrganisationCode` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Address` varchar(200) CHARACTER SET utf8mb4 NULL,
    `PhoneNumber` varchar(30) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(150) CHARACTER SET utf8mb4 NULL,
    `LogoUrl` varchar(255) CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Organisations` PRIMARY KEY (`OrganisationId`)
) CHARACTER SET=utf8mb4;

INSERT INTO `Organisations` (`OrganisationId`, `Name`, `OrganisationCode`, `Address`, `PhoneNumber`, `Email`, `LogoUrl`, `IsActive`, `CreatedAt`)
VALUES (1, 'Coldstone', 'COLDSTONE', NULL, NULL, NULL, NULL, TRUE, TIMESTAMP '2026-10-14 00:00:00');

ALTER TABLE `Users` ADD `OrganisationId` int NULL;

ALTER TABLE `Products` ADD `OrganisationId` int NULL;

UPDATE `Users` SET `OrganisationId` = 1;

UPDATE `Products` SET `OrganisationId` = 1;

ALTER TABLE `Users` MODIFY COLUMN `OrganisationId` int NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `OrganisationId` int NOT NULL;

CREATE INDEX `IX_Users_OrganisationId` ON `Users` (`OrganisationId`);

CREATE INDEX `IX_Products_OrganisationId` ON `Products` (`OrganisationId`);

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Organisations_OrganisationId` FOREIGN KEY (`OrganisationId`) REFERENCES `Organisations` (`OrganisationId`) ON DELETE CASCADE;

ALTER TABLE `Products` ADD CONSTRAINT `FK_Products_Organisations_OrganisationId` FOREIGN KEY (`OrganisationId`) REFERENCES `Organisations` (`OrganisationId`) ON DELETE CASCADE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261014133231_AddOrganisationSupport', '9.0.9');

ALTER TABLE `Sales` ADD `OrganisationId` int NULL;


            UPDATE Sales s
            INNER JOIN Users u ON s.UserId = u.UserId
            SET s.OrganisationId = u.OrganisationId;
        

ALTER TABLE `Sales` DROP INDEX `IX_Sales_ClientSaleId`;

ALTER TABLE `Sales` DROP INDEX `IX_Sales_ReceiptToken`;

ALTER TABLE `Sales` MODIFY COLUMN `OrganisationId` int NOT NULL;

CREATE UNIQUE INDEX `IX_Sales_OrganisationId_ClientSaleId` ON `Sales` (`OrganisationId`, `ClientSaleId`);

CREATE UNIQUE INDEX `IX_Sales_OrganisationId_ReceiptToken` ON `Sales` (`OrganisationId`, `ReceiptToken`);

ALTER TABLE `Sales` ADD CONSTRAINT `FK_Sales_Organisations_OrganisationId` FOREIGN KEY (`OrganisationId`) REFERENCES `Organisations` (`OrganisationId`) ON DELETE CASCADE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261014153712_AddOrganisationToSales', '9.0.9');

CREATE UNIQUE INDEX `IX_Products_OrganisationId_ProductCode` ON `Products` (`OrganisationId`, `ProductCode`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261016100155_AddOrganisationProductCodeUniqueIndex', '9.0.9');

CREATE UNIQUE INDEX `IX_Organisations_OrganisationCode` ON `Organisations` (`OrganisationCode`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261016120955_AddUniqueOrganisationCode', '9.0.9');

ALTER TABLE `Products` MODIFY COLUMN `CostPrice` decimal(18,2) NULL;

ALTER TABLE `Products` ADD `StockType` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'SingleUnit';

ALTER TABLE `Products` ADD `UnitsPerPack` int NOT NULL DEFAULT 1;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261111113150_AddProductPackConversion', '9.0.9');

COMMIT;

