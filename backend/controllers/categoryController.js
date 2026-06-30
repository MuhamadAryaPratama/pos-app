import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findByName(name);
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Kategori dengan nama tersebut sudah ada",
      });
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      created_by: req.user.id,
    });

    // Get updated categories list with pagination for real-time update
    const { page = 1, limit = 10 } = req.query;
    const result = await Category.findAll(page, limit);

    res.status(201).json({
      success: true,
      message: "Kategori berhasil dibuat",
      data: {
        category,
        // Return updated categories list for frontend update
        categories: result.categories,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await Category.findAll(page, limit);

    res.json({
      success: true,
      data: {
        categories: result.categories,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    // Check if new name already exists (excluding current category)
    const categoryWithSameName = await Category.findByName(name);
    if (categoryWithSameName && categoryWithSameName.id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: "Kategori dengan nama tersebut sudah ada",
      });
    }

    // Update category
    const updatedCategory = await Category.update(id, { name, description });
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    // Get updated categories list for real-time update
    const { page = 1, limit = 10 } = req.query;
    const result = await Category.findAll(page, limit);

    res.json({
      success: true,
      message: "Kategori berhasil diperbarui",
      data: {
        category: updatedCategory,
        // Return updated categories list for frontend update
        categories: result.categories,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    // Check if category has products
    const hasProducts = await Category.hasProducts(id);
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat menghapus kategori karena masih memiliki produk",
      });
    }

    // Delete category permanently
    const isDeleted = await Category.delete(id);
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    // Get updated categories list for real-time update
    const { page = 1, limit = 10 } = req.query;
    const result = await Category.findAll(page, limit);

    res.json({
      success: true,
      message: "Kategori berhasil dihapus secara permanen",
      data: {
        // Return updated categories list for frontend update
        categories: result.categories,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const result = await Category.getProductsByCategory(id, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get category products error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCategoriesWithStats = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get categories with pagination
    const categoriesResult = await Category.findAll(page, limit);

    // Get statistics for all categories
    const stats = await Category.getCategoryStats();

    // Merge stats with categories data
    const categoriesWithStats = categoriesResult.categories.map((category) => {
      const categoryStats = stats.find((stat) => stat.id === category.id) || {
        product_count: 0,
        available_products: 0,
        unavailable_products: 0,
      };

      return {
        ...category,
        ...categoryStats,
      };
    });

    res.json({
      success: true,
      data: {
        categories: categoriesWithStats,
        pagination: categoriesResult.pagination,
      },
    });
  } catch (error) {
    console.error("Get categories with stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
