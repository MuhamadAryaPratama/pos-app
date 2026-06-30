import request from "supertest";
import app from "../app.js";
import { createTestUser, createTestCategory, createTestProduct, getAuthToken } from "./helpers.js";

describe("Products API Endpoints", () => {
  let pemilikUser, karyawanUser;
  let pemilikToken, karyawanToken;
  let category;

  beforeEach(async () => {
    pemilikUser = await createTestUser({ role: "pemilik", email: "pemilik@example.com" });
    karyawanUser = await createTestUser({ role: "karyawan", email: "karyawan@example.com" });

    pemilikToken = getAuthToken(pemilikUser);
    karyawanToken = getAuthToken(karyawanUser);

    category = await createTestCategory({ name: "Beverages" }, pemilikUser.id);
  });

  describe("POST /api/products", () => {
    it("should allow pemilik to create product without image", async () => {
      const payload = {
        name: "Iced Coffee Latte",
        price: 18000,
        category_id: category.id,
        description: "Espresso with milk and ice",
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe(payload.name);
      expect(parseFloat(res.body.data.product.price)).toBe(payload.price);
      expect(res.body.data.product.category_id).toBe(payload.category_id);
    });

    it("should allow pemilik to create product with image upload", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .field("name", "Avocado Juice")
        .field("price", 15000)
        .field("category_id", category.id)
        .attach("image", Buffer.from("dummy-image-binary-data"), "avocado.png");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.image_url).toContain("/uploads/products/product-");
    });

    it("should fail if name is missing", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send({ price: 10000, category_id: category.id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should fail if price is invalid", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send({ name: "Cheap Coffee", price: -500, category_id: category.id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should deny creation access to karyawan", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send({ name: "Tea", price: 5000, category_id: category.id });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/products", () => {
    it("should list products with pagination and filters", async () => {
      await createTestProduct({ name: "Product A", price: 10000, is_available: true }, category.id, pemilikUser.id);
      await createTestProduct({ name: "Product B", price: 20000, is_available: false }, category.id, pemilikUser.id);

      const res = await request(app)
        .get("/api/products?page=1&limit=10&search=Product")
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBe(2);
    });

    it("should filter by category_id", async () => {
      const otherCategory = await createTestCategory({ name: "Snacks" }, pemilikUser.id);
      await createTestProduct({ name: "Drink Product" }, category.id, pemilikUser.id);
      await createTestProduct({ name: "Snack Product" }, otherCategory.id, pemilikUser.id);

      const res = await request(app)
        .get(`/api/products?category_id=${otherCategory.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].name).toBe("Snack Product");
    });
  });

  describe("GET /api/products/:id", () => {
    it("should get specific product by ID", async () => {
      const product = await createTestProduct({ name: "Target Product" }, category.id, pemilikUser.id);

      const res = await request(app)
        .get(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe("Target Product");
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app)
        .get("/api/products/999999")
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should allow pemilik to update product details", async () => {
      const product = await createTestProduct({ name: "Old Name", price: 1000 }, category.id, pemilikUser.id);

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send({ name: "Updated Name", price: 1500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe("Updated Name");
      expect(parseFloat(res.body.data.product.price)).toBe(1500);
    });

    it("should deny update access to karyawan", async () => {
      const product = await createTestProduct({ name: "Protected" }, category.id, pemilikUser.id);

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send({ name: "Hacked" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should allow pemilik to delete a product", async () => {
      const product = await createTestProduct({ name: "To Be Deleted" }, category.id, pemilikUser.id);

      const res = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny delete access to karyawan", async () => {
      const product = await createTestProduct({ name: "To Be Saved" }, category.id, pemilikUser.id);

      const res = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(403);
    });
  });
});
