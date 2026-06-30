import request from "supertest";
import app from "../app.js";
import { createTestUser, createTestCategory, createTestProduct, getAuthToken } from "./helpers.js";

describe("Transactions API Endpoints", () => {
  let pemilikUser, karyawanUser;
  let pemilikToken, karyawanToken;
  let category, productA, productB;

  beforeEach(async () => {
    pemilikUser = await createTestUser({ role: "pemilik", email: "pemilik@example.com" });
    karyawanUser = await createTestUser({ role: "karyawan", email: "karyawan@example.com" });

    pemilikToken = getAuthToken(pemilikUser);
    karyawanToken = getAuthToken(karyawanUser);

    category = await createTestCategory({ name: "Food" }, pemilikUser.id);
    productA = await createTestProduct({ name: "Bakso", price: 15000 }, category.id, pemilikUser.id);
    productB = await createTestProduct({ name: "Es Teh", price: 5000 }, category.id, pemilikUser.id);
  });

  describe("POST /api/transactions", () => {
    it("should create a cash transaction successfully and calculate tax/change correctly", async () => {
      // Subtotal = (15000 * 2) + (5000 * 1) = 35000
      // Tax = 35000 * 0.1 = 3500
      // Total = 38500
      // Paid = 50000
      // Change = 11500
      const payload = {
        payment_method: "cash",
        paid_amount: 50000,
        customer_name: "John Doe",
        items: [
          { product_id: productA.id, quantity: 2 },
          { product_id: productB.id, quantity: 1 },
        ],
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.payment_method).toBe("cash");
      expect(res.body.data.transaction.status).toBe("confirmed");
      expect(parseFloat(res.body.data.transaction.subtotal_amount)).toBe(35000);
      expect(parseFloat(res.body.data.transaction.tax_amount)).toBe(3500);
      expect(parseFloat(res.body.data.transaction.total_amount)).toBe(38500);
      expect(parseFloat(res.body.data.transaction.paid_amount)).toBe(50000);
      expect(parseFloat(res.body.data.transaction.change_amount)).toBe(11500);
      expect(res.body.data.transaction.items.length).toBe(2);
    });

    it("should create a QRIS transaction with pending status", async () => {
      const payload = {
        payment_method: "qris",
        paid_amount: 22000, // Total = 20000 + 2000 = 22000
        items: [
          { product_id: productA.id, quantity: 1 },
          { product_id: productB.id, quantity: 1 },
        ],
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.status).toBe("pending");
      expect(res.body.data.requires_confirmation).toBe(true);
    });

    it("should fail transaction if paid amount is insufficient", async () => {
      const payload = {
        payment_method: "cash",
        paid_amount: 10000, // Insufficient (total would be 22000)
        items: [
          { product_id: productA.id, quantity: 1 },
          { product_id: productB.id, quantity: 1 },
        ],
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Insufficient payment");
    });
  });

  describe("PATCH /api/transactions/:id/confirm-qris & cancel-qris", () => {
    let qrisTx;

    beforeEach(async () => {
      const payload = {
        payment_method: "qris",
        paid_amount: 22000,
        items: [{ product_id: productA.id, quantity: 1 }, { product_id: productB.id, quantity: 1 }],
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      qrisTx = res.body.data.transaction;
    });

    it("should confirm QRIS payment successfully", async () => {
      const res = await request(app)
        .patch(`/api/transactions/${qrisTx.id}/confirm-qris`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.status).toBe("confirmed");
      expect(res.body.data.transaction.qris_confirmed_by).toBe(karyawanUser.id);
    });

    it("should cancel QRIS payment successfully", async () => {
      const res = await request(app)
        .patch(`/api/transactions/${qrisTx.id}/cancel-qris`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.status).toBe("cancelled");
    });

    it("should reject confirmation of an already confirmed transaction", async () => {
      // First confirmation
      await request(app)
        .patch(`/api/transactions/${qrisTx.id}/confirm-qris`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      // Second confirmation
      const res = await request(app)
        .patch(`/api/transactions/${qrisTx.id}/confirm-qris`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET transactions list", () => {
    it("should list transactions and filter today / pending QRIS", async () => {
      const payload = {
        payment_method: "qris",
        paid_amount: 22000,
        items: [{ product_id: productA.id, quantity: 1 }, { product_id: productB.id, quantity: 1 }],
      };

      // Create a pending QRIS transaction
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      const txId = createRes.body.data.transaction.id;

      // 1. Get all transactions
      const resAll = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`);
      expect(resAll.status).toBe(200);
      expect(resAll.body.data.transactions.length).toBeGreaterThanOrEqual(1);

      // 2. Get today's transactions
      const resToday = await request(app)
        .get("/api/transactions/today")
        .set("Authorization", `Bearer ${karyawanToken}`);
      expect(resToday.status).toBe(200);
      expect(resToday.body.data.transactions.length).toBeGreaterThanOrEqual(1);

      // 3. Get pending QRIS
      const resPending = await request(app)
        .get("/api/transactions/pending-qris")
        .set("Authorization", `Bearer ${karyawanToken}`);
      expect(resPending.status).toBe(200);
      const pendingTxIds = resPending.body.data.transactions.map(t => t.id);
      expect(pendingTxIds).toContain(txId);
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    let tx;

    beforeEach(async () => {
      const payload = {
        payment_method: "cash",
        paid_amount: 20000,
        items: [{ product_id: productA.id, quantity: 1 }],
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${karyawanToken}`)
        .send(payload);

      tx = res.body.data.transaction;
    });

    it("should allow pemilik to delete a transaction", async () => {
      const res = await request(app)
        .delete(`/api/transactions/${tx.id}`)
        .set("Authorization", `Bearer ${pemilikToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject transaction deletion by karyawan", async () => {
      const res = await request(app)
        .delete(`/api/transactions/${tx.id}`)
        .set("Authorization", `Bearer ${karyawanToken}`);

      expect(res.status).toBe(403);
    });
  });
});
