import {
	MySqlContainer,
	type StartedMySqlContainer,
} from "@testcontainers/mysql";
import { sql } from "drizzle-orm";
import { int, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	onDuplicateKeyUpdateConfig,
	onDuplicateKeyUpdateSet,
} from "../../src/onDuplicateKeyUpdate";

// Check if Docker is available
async function isDockerAvailable(): Promise<boolean> {
	try {
		const { execSync } = await import("node:child_process");
		execSync("docker info", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

const dockerAvailable = await isDockerAvailable();
const describeIfDocker = dockerAvailable ? describe : describe.skip;

// Define test tables
const usersTable = mysqlTable("users", {
	id: int().primaryKey(),
	email: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	age: int(),
});

const productsTable = mysqlTable("products", {
	id: int().primaryKey(),
	sku: varchar({ length: 255 }).notNull().unique(),
	name: varchar({ length: 255 }).notNull(),
	price: int().notNull(),
	stock: int().default(0),
});

const orderItemsTable = mysqlTable(
	"order_items",
	{
		orderId: int().notNull(),
		productId: int().notNull(),
		quantity: int().notNull(),
		price: int().notNull(),
	},
	(table) => [primaryKey({ columns: [table.orderId, table.productId] })],
);

describeIfDocker("MySQL Integration Tests", () => {
	let container: StartedMySqlContainer;
	let connection: mysql.Connection;
	let db: MySql2Database;

	beforeAll(async () => {
		container = await new MySqlContainer("mysql:8.0").start();

		connection = await mysql.createConnection({
			host: container.getHost(),
			port: container.getPort(),
			user: container.getUsername(),
			password: container.getUserPassword(),
			database: container.getDatabase(),
		});

		db = drizzle(connection);

		// Create tables
		await connection.query(`
			CREATE TABLE users (
				id INT PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE,
				name VARCHAR(255) NOT NULL,
				age INT
			)
		`);

		await connection.query(`
			CREATE TABLE products (
				id INT PRIMARY KEY,
				sku VARCHAR(255) NOT NULL UNIQUE,
				name VARCHAR(255) NOT NULL,
				price INT NOT NULL,
				stock INT DEFAULT 0
			)
		`);

		await connection.query(`
			CREATE TABLE order_items (
				order_id INT NOT NULL,
				product_id INT NOT NULL,
				quantity INT NOT NULL,
				price INT NOT NULL,
				PRIMARY KEY (order_id, product_id)
			)
		`);
	});

	afterAll(async () => {
		await connection.end();
		await container.stop();
	});

	describe("onDuplicateKeyUpdate with simple primary key", () => {
		it("should insert new record when no duplicate", async () => {
			await db
				.insert(usersTable)
				.values({
					id: 1,
					email: "test@example.com",
					name: "Test User",
					age: 25,
				})
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(usersTable));

			const result = await db.select().from(usersTable).where(sql`id = 1`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Test User");
		});

		it("should update existing record on duplicate key", async () => {
			// Insert initial record
			await db.insert(usersTable).values({
				id: 2,
				email: "update@example.com",
				name: "Original",
				age: 30,
			});

			// Attempt insert with same id - should update
			await db
				.insert(usersTable)
				.values({
					id: 2,
					email: "update@example.com",
					name: "Updated",
					age: 31,
				})
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(usersTable));

			const result = await db.select().from(usersTable).where(sql`id = 2`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Updated");
			expect(result[0]?.age).toBe(31);
		});

		it("should only update specified columns with keep option", async () => {
			// Insert initial record
			await db.insert(usersTable).values({
				id: 3,
				email: "keep@example.com",
				name: "Original",
				age: 40,
			});

			// Update with keep - only update name, not age
			await db
				.insert(usersTable)
				.values({ id: 3, email: "keep@example.com", name: "Kept", age: 99 })
				.onDuplicateKeyUpdate({
					set: onDuplicateKeyUpdateSet(usersTable, { keep: [usersTable.name] }),
				});

			const result = await db.select().from(usersTable).where(sql`id = 3`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Kept");
			expect(result[0]?.age).toBe(40); // Age should NOT be updated
		});

		it("should exclude specified columns with exclude option", async () => {
			// Insert initial record
			await db.insert(usersTable).values({
				id: 4,
				email: "exclude@example.com",
				name: "Original",
				age: 50,
			});

			// Update with exclude - don't update age
			await db
				.insert(usersTable)
				.values({
					id: 4,
					email: "exclude@example.com",
					name: "Excluded",
					age: 100,
				})
				.onDuplicateKeyUpdate({
					set: onDuplicateKeyUpdateSet(usersTable, {
						exclude: [usersTable.age],
					}),
				});

			const result = await db.select().from(usersTable).where(sql`id = 4`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Excluded");
			expect(result[0]?.age).toBe(50); // Age should NOT be updated
		});
	});

	describe("onDuplicateKeyUpdate with unique constraint", () => {
		it("should handle duplicate on unique column", async () => {
			// Insert initial record
			await db.insert(productsTable).values({
				id: 1,
				sku: "SKU001",
				name: "Product 1",
				price: 100,
				stock: 10,
			});

			// Insert with different id but same SKU - duplicate on unique
			await db
				.insert(productsTable)
				.values({
					id: 2,
					sku: "SKU001",
					name: "Updated Product",
					price: 150,
					stock: 20,
				})
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(productsTable));

			const result = await db
				.select()
				.from(productsTable)
				.where(sql`sku = 'SKU001'`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Updated Product");
			expect(result[0]?.price).toBe(150);
		});

		it("should handle duplicate on primary key for products", async () => {
			// Insert initial record
			await db.insert(productsTable).values({
				id: 10,
				sku: "SKU010",
				name: "Product 10",
				price: 200,
				stock: 5,
			});

			// Update via primary key duplicate
			await db
				.insert(productsTable)
				.values({
					id: 10,
					sku: "SKU010",
					name: "Updated 10",
					price: 250,
					stock: 15,
				})
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(productsTable));

			const result = await db.select().from(productsTable).where(sql`id = 10`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Updated 10");
			expect(result[0]?.stock).toBe(15);
		});
	});

	describe("onDuplicateKeyUpdate with composite primary key", () => {
		it("should insert new record with composite pk", async () => {
			await db
				.insert(orderItemsTable)
				.values({ orderId: 1, productId: 1, quantity: 2, price: 100 })
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(orderItemsTable));

			const result = await db
				.select()
				.from(orderItemsTable)
				.where(sql`order_id = 1 AND product_id = 1`);
			expect(result).toHaveLength(1);
			expect(result[0]?.quantity).toBe(2);
		});

		it("should update on composite pk duplicate", async () => {
			// Insert initial
			await db
				.insert(orderItemsTable)
				.values({ orderId: 2, productId: 2, quantity: 1, price: 50 });

			// Update via duplicate
			await db
				.insert(orderItemsTable)
				.values({ orderId: 2, productId: 2, quantity: 5, price: 75 })
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(orderItemsTable));

			const result = await db
				.select()
				.from(orderItemsTable)
				.where(sql`order_id = 2 AND product_id = 2`);
			expect(result).toHaveLength(1);
			expect(result[0]?.quantity).toBe(5);
			expect(result[0]?.price).toBe(75);
		});

		it("should only update quantity with keep option", async () => {
			// Insert initial
			await db
				.insert(orderItemsTable)
				.values({ orderId: 3, productId: 3, quantity: 1, price: 100 });

			// Update only quantity
			await db
				.insert(orderItemsTable)
				.values({ orderId: 3, productId: 3, quantity: 10, price: 200 })
				.onDuplicateKeyUpdate({
					set: onDuplicateKeyUpdateSet(orderItemsTable, {
						keep: [orderItemsTable.quantity],
					}),
				});

			const result = await db
				.select()
				.from(orderItemsTable)
				.where(sql`order_id = 3 AND product_id = 3`);
			expect(result).toHaveLength(1);
			expect(result[0]?.quantity).toBe(10);
			expect(result[0]?.price).toBe(100); // Price should NOT be updated
		});
	});

	describe("bulk upsert operations", () => {
		it("should handle multiple inserts with duplicates", async () => {
			// Insert some initial data
			await db.insert(usersTable).values([
				{ id: 100, email: "bulk1@example.com", name: "Bulk 1", age: 20 },
				{ id: 101, email: "bulk2@example.com", name: "Bulk 2", age: 21 },
			]);

			// Bulk upsert - some new, some existing
			await db
				.insert(usersTable)
				.values([
					{
						id: 100,
						email: "bulk1@example.com",
						name: "Updated Bulk 1",
						age: 25,
					},
					{
						id: 101,
						email: "bulk2@example.com",
						name: "Updated Bulk 2",
						age: 26,
					},
					{ id: 102, email: "bulk3@example.com", name: "New Bulk 3", age: 22 },
				])
				.onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(usersTable));

			const results = await db
				.select()
				.from(usersTable)
				.where(sql`id >= 100 AND id <= 102`);
			expect(results).toHaveLength(3);

			const user100 = results.find((u) => u.id === 100);
			const user101 = results.find((u) => u.id === 101);
			const user102 = results.find((u) => u.id === 102);

			expect(user100?.name).toBe("Updated Bulk 1");
			expect(user101?.name).toBe("Updated Bulk 2");
			expect(user102?.name).toBe("New Bulk 3");
		});
	});

	describe("MySQL-specific behavior", () => {
		it("should allow updating primary key with explicit keep (MySQL feature)", async () => {
			// Insert initial record
			await db.insert(usersTable).values({
				id: 200,
				email: "pkupdate@example.com",
				name: "PK Update",
				age: 30,
			});

			// MySQL allows updating primary key via ON DUPLICATE KEY UPDATE
			// This is a MySQL-specific feature
			await db
				.insert(usersTable)
				.values({
					id: 200,
					email: "pkupdate@example.com",
					name: "PK Updated",
					age: 35,
				})
				.onDuplicateKeyUpdate({
					set: onDuplicateKeyUpdateSet(usersTable, {
						keep: [usersTable.id, usersTable.name, usersTable.age],
					}),
				});

			const result = await db
				.select()
				.from(usersTable)
				.where(sql`email = 'pkupdate@example.com'`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("PK Updated");
		});
	});
});
