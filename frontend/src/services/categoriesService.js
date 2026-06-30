import { api } from "./authService";
import { authService } from "./authService";

export const categoriesService = {
  // Get all categories - handle different roles
  getAllCategories: async () => {
    try {
      const currentUser = authService.getCurrentUser();

      // Untuk karyawan, gunakan endpoint biasa
      // Untuk pemilik, gunakan endpoint dengan stats
      const endpoint =
        currentUser?.role === "pemilik"
          ? "/categories/stats/summary"
          : "/categories";

      const response = await api.get(endpoint);
      console.log("Categories API Response:", response.data);

      // Handle berbagai format response
      if (response.data) {
        // Format 1: {success: true, data: {categories: [...], pagination: {...}}}
        if (response.data.success && response.data.data?.categories) {
          return {
            success: true,
            data: response.data.data.categories,
            pagination: response.data.data.pagination,
          };
        }

        // Format 2: {success: true, data: [...]}
        if (response.data.success && Array.isArray(response.data.data)) {
          return {
            success: true,
            data: response.data.data,
          };
        }

        // Format 3: Response langsung array
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
          };
        }

        // Format 4: {categories: [...]}
        if (
          response.data.categories &&
          Array.isArray(response.data.categories)
        ) {
          return {
            success: true,
            data: response.data.categories,
          };
        }

        // Format 5: {success: true, categories: [...]}
        if (response.data.success && Array.isArray(response.data.categories)) {
          return {
            success: true,
            data: response.data.categories,
          };
        }
      }

      // Default fallback
      console.warn("Unknown response format:", response.data);
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Jika error 403 (Forbidden), coba endpoint biasa
      if (error.response?.status === 403) {
        try {
          console.log(
            "Access denied to stats endpoint, trying regular endpoint..."
          );
          const fallbackResponse = await api.get("/categories");

          if (
            fallbackResponse.data?.success &&
            fallbackResponse.data.data?.categories
          ) {
            return {
              success: true,
              data: fallbackResponse.data.data.categories,
              pagination: fallbackResponse.data.data.pagination,
            };
          }

          if (
            fallbackResponse.data?.success &&
            Array.isArray(fallbackResponse.data.data)
          ) {
            return {
              success: true,
              data: fallbackResponse.data.data,
            };
          }
        } catch (fallbackError) {
          console.error("Fallback endpoint also failed:", fallbackError);
        }
      }

      return {
        success: false,
        message:
          error.response?.data?.message || "Gagal mengambil data kategori",
        data: [],
      };
    }
  },

  // Get categories for dropdown (tanpa stats)
  getCategoriesDropdown: async () => {
    try {
      const response = await api.get("/categories");

      // Handle response format
      if (response.data?.success && response.data.data?.categories) {
        return {
          success: true,
          data: response.data.data.categories,
        };
      }

      if (response.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching categories dropdown:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Gagal mengambil data kategori",
        data: [],
      };
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);

      // Handle response format
      if (response.data?.success && response.data.data?.category) {
        return {
          success: true,
          data: response.data.data.category,
        };
      }

      if (response.data?.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching category:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Gagal mengambil data kategori",
      };
    }
  },

  // Create new category - hanya untuk pemilik
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("/categories", categoryData);
      console.log("Create category response:", response.data);

      // Handle response format dari backend
      if (response.data?.success && response.data.data) {
        return {
          success: true,
          message: response.data.message,
          data: response.data.data.category,
          categories: response.data.data.categories,
          pagination: response.data.data.pagination,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error creating category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Gagal membuat kategori",
      };
    }
  },

  // Update category - hanya untuk pemilik
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      console.log("Update category response:", response.data);

      // Handle response format dari backend
      if (response.data?.success && response.data.data) {
        return {
          success: true,
          message: response.data.message,
          data: response.data.data.category,
          categories: response.data.data.categories,
          pagination: response.data.data.pagination,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error updating category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Gagal memperbarui kategori",
      };
    }
  },

  // Delete category - hanya untuk pemilik
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      console.log("Delete category response:", response.data);

      // Handle response format dari backend
      if (response.data?.success && response.data.data) {
        return {
          success: true,
          message: response.data.message,
          categories: response.data.data.categories,
          pagination: response.data.data.pagination,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error deleting category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Gagal menghapus kategori",
      };
    }
  },
};
