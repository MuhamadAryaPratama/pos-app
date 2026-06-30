import request from "supertest";
import app from "../app.js";
import { createTestUser, createTestCategory, getAuthToken, createTestProduct } from "./helpers.js";

describe("Categories API Endpoints", () => {
  let pemilikUser, karyawanUser;
  let pemilikToken, karyawanToken;

  beforeEach(async () => {
    pemilikUser = await createTestUser({ role: "pemilik", email: "pemilik@example.com" });
    karyawanUser = await createTestUser({ role: "karyawan", email: "karyawan@example.com" });

    pemilikToken = getAuthToken(pemilikUser);
    karyawanToken = getAuthToken(karyawanUser);
  });

  describe("POST /api/categories", () => {
    it("should allow pemilik to create a category", async () => {
      const payload = {
        name: "Makanan",
        description: "Semua jenis makanan",
      };

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe(payload.name);
    });

    it("should reject creation if category name already exists", async () => {
      await createTestCategory({ name: "Makanan" }, pemilikUser.id);

      const payload = {
        name: "Makanan",
        description: "Duplikat",
      };

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("sudah ada");
    });

    it("should deny access to karyawan", async () => {
      const payload = {
        name: "Minuman",
        description: "Semua jenis minuman",
      };

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/categories", () => {
    it("should list categories with pagination for both pemilik and karyawan", async () => {
      await createTestCategory({ name: "Cat 1" }, pemilikUser.id);
      await createTestCategory({ name: "Cat 2" }, pemilikUser.id);

      const res = await request(app)
        .get("/api/categories?page=1&limit=10")
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe("GET /api/categories/:id", () => {
    it("should retrieve specific category by ID", async () => {
      const category = await createTestCategory({ name: "Electronic" }, pemilikUser.id);

      const res = await request(app)
        .get(`/api/categories/${category.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe("Electronic");
    });

    it("should return 404 for non-existent category", async () => {
      const res = await request(app)
        .get("/api/categories/999999")
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should allow pemilik to update a category", async () => {
      const category = await createTestCategory({ name: "Jejamu" }, pemilikUser.id);

      const res = await request(app)
        .put(`/api/categories/${category.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`)
        .send({ name: "Jamu Herbal", description: "Updated description" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe("Jamu Herbal");
    });

    it("should deny update access to karyawan", async () => {
      const category = await createTestCategory({ name: "Susu" }, pemilikUser.id);

      const res = await request(app)
        .put(`/api/categories/${category.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send({ name: "Susu Murni" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should allow pemilik to delete a category that has no products", async () => {
      const category = await createTestCategory({ name: "Buku" }, pemilikUser.id);

      const res = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail to delete category if it has products", async () => {
      const category = await createTestCategory({ name: "Fashion" }, pemilikUser.id);
      await createTestProduct({ name: "Baju" }, category.id, pemilikUser.id);

      const res = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("memiliki produk");
    });
  });

  describe("GET /api/categories/:id/products", () => {
    it("should list products in the category", async () => {
      const category = await createTestCategory({ name: "Snacks" }, pemilikUser.id);
      await createTestProduct({ name: "Chiki" }, category.id, pemilikUser.id);

      const res = await request(app)
        .get(`/api/categories/${category.id}/products`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products[0].name).toBe("Chiki");
    });
  });

  describe("GET /api/categories/stats/summary", () => {
    it("should allow pemilik to get stats summary", async () => {
      const category = await createTestCategory({ name: "Roti" }, pemilikUser.id);
      await createTestProduct({ name: "Roti Tawar", is_available: true }, category.id, pemilikUser.id);

      const res = await request(app)
        .get("/api/categories/stats/summary")
        .set("Authorization", `Bearer ${pemilikToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const categoryStats = res.body.data.categories.find(c => c.id === category.id);
      expect(categoryStats).toBeDefined();
      expect(parseInt(categoryStats.product_count)).toBe(1);
    });
  });
});
