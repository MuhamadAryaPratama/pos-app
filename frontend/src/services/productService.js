import { api } from "./authService";

export const productService = {
  // Get all products with optional filters
  getProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Sesuaikan dengan query parameters yang diharapkan backend
      if (filters.search) params.append("search", filters.search);
      if (filters.category_id)
        params.append("category_id", filters.category_id);
      if (filters.is_available !== undefined)
        params.append("is_available", filters.is_available);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.sort_by) params.append("sort_by", filters.sort_by);
      if (filters.sort_order) params.append("sort_order", filters.sort_order);

      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error in getProducts:", error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in getProductById:", error);
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      const formData = new FormData();

      console.log("Original productData:", productData);

      // Validasi field required
      if (!productData.name || !productData.price || !productData.category_id) {
        throw new Error("Name, price, and category are required");
      }

      // Append required fields sesuai dengan backend validation
      formData.append("name", productData.name.trim());
      formData.append("description", productData.description?.trim() || "");
      formData.append("price", parseFloat(productData.price).toString());
      formData.append("category_id", productData.category_id.toString());
      formData.append(
        "is_available",
        productData.is_available !== undefined
          ? productData.is_available.toString()
          : "true"
      );

      // Append image jika ada dan merupakan File
      if (productData.image && productData.image instanceof File) {
        formData.append("image", productData.image);
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log("Create product response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in createProduct:", error);
      if (error.response) {
        console.error("Response error data:", error.response.data);
      }
      throw error;
    }
  },

  // Update product - FIXED: Ensure is_available is properly handled
  updateProduct: async (id, productData) => {
    try {
      const formData = new FormData();

      console.log("Updating product:", id, "with data:", productData);

      // Append semua field yang diperlukan untuk update
      // Pastikan is_available selalu dikirim untuk menghindari perubahan tidak sengaja
      formData.append("name", productData.name.trim());
      formData.append("description", productData.description?.trim() || "");
      formData.append("price", parseFloat(productData.price).toString());
      formData.append("category_id", productData.category_id.toString());
      formData.append("is_available", productData.is_available.toString());

      // Handle image removal
      if (productData.remove_image) {
        formData.append("remove_image", "true");
      }

      // Append image jika ada
      if (productData.image && productData.image instanceof File) {
        formData.append("image", productData.image);
      }

      console.log("Update FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log("Update product response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in updateProduct:", error);
      if (error.response) {
        console.error("Update response error:", error.response.data);
      }
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await api.get("/categories");
      console.log("Categories API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Fallback categories untuk development
      const fallbackCategories = {
        success: true,
        data: {
          categories: [
            { id: 1, name: "Elektronik", description: "Produk elektronik" },
            { id: 2, name: "Pakaian", description: "Pakaian dan fashion" },
            { id: 3, name: "Makanan", description: "Makanan dan minuman" },
            { id: 4, name: "Furniture", description: "Perabotan rumah" },
            { id: 5, name: "Olahraga", description: "Alat olahraga" },
          ],
        },
      };

      console.log("Using fallback categories");
      return fallbackCategories;
    }
  },

  // Simple create product untuk testing (tanpa image)
  createSimpleProduct: async (productData) => {
    try {
      const payload = {
        name: productData.name.trim(),
        description: productData.description?.trim() || "",
        price: parseFloat(productData.price),
        category_id: parseInt(productData.category_id),
        is_available:
          productData.is_available !== undefined
            ? productData.is_available
            : true,
      };

      console.log("Sending simple product payload:", payload);

      const response = await api.post("/products", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Simple create response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in createSimpleProduct:", error);
      if (error.response) {
        console.error("Simple create error response:", error.response.data);
      }
      throw error;
    }
  },
};
