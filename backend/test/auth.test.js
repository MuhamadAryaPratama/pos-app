import request from "supertest";
import app from "../app.js";
import pool from "../config/database.js";
import { createTestUser, getAuthToken } from "./helpers.js";

describe("Auth API Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register successfully with valid details", async () => {
      const payload = {
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
        role: "karyawan",
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("successful");
      expect(res.body.data.email).toBe(payload.email);
      expect(res.body.data.role).toBe(payload.role);
    });

    it("should fail register if email already exists", async () => {
      await createTestUser({ email: "existing@example.com" });

      const payload = {
        email: "existing@example.com",
        password: "password123",
        name: "Different User",
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("exists");
    });

    it("should fail register with invalid email format", async () => {
      const payload = {
        email: "invalidemail",
        password: "password123",
        name: "Bad Email",
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("email format");
    });

    it("should fail register if password is too short", async () => {
      const payload = {
        email: "shortpass@example.com",
        password: "123",
        name: "Short Pass",
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("at least 6 characters");
    });

    it("should fail register with invalid role", async () => {
      const payload = {
        email: "badrole@example.com",
        password: "password123",
        name: "Bad Role User",
        role: "superadmin",
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain("role");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const email = "loginuser@example.com";
      const password = "password123";
      await createTestUser({ email, password, name: "Login User" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
    });

    it("should fail login with wrong password", async () => {
      const email = "wrongpass@example.com";
      await createTestUser({ email, password: "password123" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid");
    });

    it("should fail login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully with valid token", async () => {
      const user = await createTestUser();
      const token = getAuthToken(user);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("logout");
    });

    it("should fail logout without authorization header", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should retrieve profile with valid token", async () => {
      const user = await createTestUser({ name: "Profile User" });
      const token = getAuthToken(user);

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.name).toBe("Profile User");
    });

    it("should fail to retrieve profile with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer invalidtoken`);

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("should update profile name and email successfully", async () => {
      const user = await createTestUser({ name: "Old Name", email: "oldemail@example.com" });
      const token = getAuthToken(user);

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name", email: "newemail@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe("New Name");
      expect(res.body.data.user.email).toBe("newemail@example.com");
    });

    it("should update password successfully", async () => {
      const user = await createTestUser({ password: "oldpassword123" });
      const token = getAuthToken(user);

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "oldpassword123",
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that we can login with the new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "newpassword123" });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it("should fail password update if current password is incorrect", async () => {
      const user = await createTestUser({ password: "correctpassword" });
      const token = getAuthToken(user);

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain("current password is incorrect");
    });
  });

  describe("Forgot/Reset Password Flow", () => {
    it("should flow forgot and reset password successfully", async () => {
      const email = "forgotpass@example.com";
      const user = await createTestUser({ email, password: "oldpassword" });

      // 1. Request forgot password
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.data.resetToken).toBeDefined();

      const token = forgotRes.body.data.resetToken;

      // 2. Reset password
      const resetRes = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token,
          newPassword: "brandnewpassword",
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Try login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "brandnewpassword" });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });
});
