START TRANSACTION;
ALTER TABLE `Products` MODIFY COLUMN `CostPrice` decimal(18,2) NULL;

ALTER TABLE `Products` ADD `StockType` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'SingleUnit';

ALTER TABLE `Products` ADD `UnitsPerPack` int NOT NULL DEFAULT 1;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261111113150_AddProductPackConversion', '9.0.9');

COMMIT;

