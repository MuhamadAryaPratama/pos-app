import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-jest-testing-purposes-only";

export const getAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
};

export const createTestUser = async (data = {}) => {
  const defaultUser = {
    email: `test-${Math.random().toString(36).substring(7)}@example.com`,
    password: "password123",
    name: "Test User",
    role: "karyawan",
  };

  const userData = { ...defaultUser, ...data };
  return await User.create(userData);
};

export const createTestCategory = async (data = {}, createdByUserId) => {
  const defaultCategory = {
    name: `Category ${Math.random().toString(36).substring(7)}`,
    description: "Test category description",
    created_by: createdByUserId,
  };

  const categoryData = { ...defaultCategory, ...data };
  return await Category.create(categoryData);
};

export const createTestProduct = async (data = {}, categoryId, createdByUserId) => {
  const defaultProduct = {
    name: `Product ${Math.random().toString(36).substring(7)}`,
    description: "Test product description",
    price: 15000,
    category_id: categoryId,
    image_url: null,
    is_available: true,
    created_by: createdByUserId,
  };

  const productData = { ...defaultProduct, ...data };
  return await Product.create(productData);
};
