import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	onConflictDoUpdateConfig,
	onConflictDoUpdateSet,
	onConflictDoUpdateTarget,
} from "../../src/onConflictDoUpdate";

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
const usersTable = pgTable("users", {
	id: integer().primaryKey(),
	email: text().notNull().unique(),
	name: text().notNull(),
	age: integer(),
});

const productsTable = pgTable("products", {
	id: integer().primaryKey(),
	sku: text().notNull().unique(),
	name: text().notNull(),
	price: integer().notNull(),
	stock: integer().default(0),
});

const orderItemsTable = pgTable(
	"order_items",
	{
		orderId: integer().notNull(),
		productId: integer().notNull(),
		quantity: integer().notNull(),
		price: integer().notNull(),
	},
	(table) => [primaryKey({ columns: [table.orderId, table.productId] })],
);

describeIfDocker("PostgreSQL Integration Tests", () => {
	let container: StartedPostgreSqlContainer;
	let client: postgres.Sql;
	let db: PostgresJsDatabase;

	beforeAll(async () => {
		container = await new PostgreSqlContainer("postgres:16-alpine").start();

		client = postgres(container.getConnectionUri());
		db = drizzle(client);

		// Create tables
		await client`
			CREATE TABLE users (
				id INTEGER PRIMARY KEY,
				email TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				age INTEGER
			)
		`;

		await client`
			CREATE TABLE products (
				id INTEGER PRIMARY KEY,
				sku TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				price INTEGER NOT NULL,
				stock INTEGER DEFAULT 0
			)
		`;

		await client`
			CREATE TABLE order_items (
				order_id INTEGER NOT NULL,
				product_id INTEGER NOT NULL,
				quantity INTEGER NOT NULL,
				price INTEGER NOT NULL,
				PRIMARY KEY (order_id, product_id)
			)
		`;
	});

	afterAll(async () => {
		await client.end();
		await container.stop();
	});

	describe("onConflictDoUpdate with simple primary key", () => {
		it("should insert new record when no conflict", async () => {
			await db
				.insert(usersTable)
				.values({
					id: 1,
					email: "test@example.com",
					name: "Test User",
					age: 25,
				})
				.onConflictDoUpdate(onConflictDoUpdateConfig(usersTable));

			const result = await db.select().from(usersTable).where(sql`id = 1`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Test User");
		});

		it("should update existing record on conflict", async () => {
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
				.onConflictDoUpdate(onConflictDoUpdateConfig(usersTable));

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
				.onConflictDoUpdate({
					target: onConflictDoUpdateTarget(usersTable),
					set: onConflictDoUpdateSet(usersTable, { keep: [usersTable.name] }),
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
				.onConflictDoUpdate({
					target: onConflictDoUpdateTarget(usersTable),
					set: onConflictDoUpdateSet(usersTable, { exclude: [usersTable.age] }),
				});

			const result = await db.select().from(usersTable).where(sql`id = 4`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Excluded");
			expect(result[0]?.age).toBe(50); // Age should NOT be updated
		});
	});

	describe("onConflictDoUpdate with unique constraint", () => {
		it("should handle conflict on unique column", async () => {
			// Insert initial record
			await db.insert(productsTable).values({
				id: 1,
				sku: "SKU001",
				name: "Product 1",
				price: 100,
				stock: 10,
			});

			// Insert with different id but same SKU - conflict on unique
			await db
				.insert(productsTable)
				.values({
					id: 2,
					sku: "SKU001",
					name: "Updated Product",
					price: 150,
					stock: 20,
				})
				.onConflictDoUpdate({
					target: [productsTable.sku],
					set: onConflictDoUpdateSet(productsTable, {
						target: [productsTable.sku],
					}),
				});

			const result = await db
				.select()
				.from(productsTable)
				.where(sql`sku = 'SKU001'`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Updated Product");
			expect(result[0]?.price).toBe(150);
			expect(result[0]?.id).toBe(1); // ID should remain unchanged
		});

		it("should handle conflict on primary key for products", async () => {
			// Insert initial record
			await db.insert(productsTable).values({
				id: 10,
				sku: "SKU010",
				name: "Product 10",
				price: 200,
				stock: 5,
			});

			// Update via primary key conflict
			await db
				.insert(productsTable)
				.values({
					id: 10,
					sku: "SKU010",
					name: "Updated 10",
					price: 250,
					stock: 15,
				})
				.onConflictDoUpdate(onConflictDoUpdateConfig(productsTable));

			const result = await db.select().from(productsTable).where(sql`id = 10`);
			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Updated 10");
			expect(result[0]?.stock).toBe(15);
		});
	});

	describe("onConflictDoUpdate with composite primary key", () => {
		it("should insert new record with composite pk", async () => {
			await db
				.insert(orderItemsTable)
				.values({ orderId: 1, productId: 1, quantity: 2, price: 100 })
				.onConflictDoUpdate({
					target: [orderItemsTable.orderId, orderItemsTable.productId],
					set: onConflictDoUpdateSet(orderItemsTable, {
						target: [orderItemsTable.orderId, orderItemsTable.productId],
					}),
				});

			const result = await db
				.select()
				.from(orderItemsTable)
				.where(sql`order_id = 1 AND product_id = 1`);
			expect(result).toHaveLength(1);
			expect(result[0]?.quantity).toBe(2);
		});

		it("should update on composite pk conflict", async () => {
			// Insert initial
			await db
				.insert(orderItemsTable)
				.values({ orderId: 2, productId: 2, quantity: 1, price: 50 });

			// Update via conflict
			await db
				.insert(orderItemsTable)
				.values({ orderId: 2, productId: 2, quantity: 5, price: 75 })
				.onConflictDoUpdate({
					target: [orderItemsTable.orderId, orderItemsTable.productId],
					set: onConflictDoUpdateSet(orderItemsTable, {
						target: [orderItemsTable.orderId, orderItemsTable.productId],
					}),
				});

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
				.onConflictDoUpdate({
					target: [orderItemsTable.orderId, orderItemsTable.productId],
					set: onConflictDoUpdateSet(orderItemsTable, {
						target: [orderItemsTable.orderId, orderItemsTable.productId],
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
		it("should handle multiple inserts with conflicts", async () => {
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
				.onConflictDoUpdate(onConflictDoUpdateConfig(usersTable));

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
});
