import { db } from "@/infrastructure/db/client";
import { DrizzleProductRepository } from "@/infrastructure/repositories/common/drizzle-product-repository";
import { DrizzleCustomerRepository } from "@/infrastructure/repositories/common/drizzle-customer-repository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/common/drizzle-user-repository";
import { DrizzleLineUserMappingRepository } from "@/infrastructure/repositories/common/drizzle-line-user-mapping-repository";
import { DrizzleInventoryRepository } from "@/infrastructure/repositories/inventory/drizzle-inventory-repository";
import { SearchProducts } from "@/use-cases/common/search-products";
import { GetProduct } from "@/use-cases/common/get-product";
import { GetCustomers } from "@/use-cases/common/get-customers";
import { GetCustomer } from "@/use-cases/common/get-customer";

// ── Repositories ──
const productRepository = new DrizzleProductRepository(db);
const customerRepository = new DrizzleCustomerRepository(db);
const userRepository = new DrizzleUserRepository(db);
const lineUserMappingRepository = new DrizzleLineUserMappingRepository(db);
const inventoryRepository = new DrizzleInventoryRepository(db);

// ── Use Cases ──
export const searchProducts = new SearchProducts(productRepository);
export const getProduct = new GetProduct(productRepository);
export const getCustomers = new GetCustomers(customerRepository);
export const getCustomer = new GetCustomer(customerRepository);

// ── Export repositories for direct access if needed ──
export const repositories = {
  product: productRepository,
  customer: customerRepository,
  user: userRepository,
  lineUserMapping: lineUserMappingRepository,
  inventory: inventoryRepository,
} as const;
