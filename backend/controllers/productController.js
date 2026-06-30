import Product from "../models/Product.js";
import path from "path";
import fs from "fs";

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, is_available } = req.body;

    console.log("Received data:", req.body);
    console.log("Files:", req.file);

    // Validasi required fields
    if (!name || !price || !category_id) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required",
      });
    }

    // Validasi tipe data price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than 0",
      });
    }

    // Validasi category_id
    const categoryIdNum = parseInt(category_id);
    if (isNaN(categoryIdNum)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Category ID must be a valid number",
      });
    }

    // Handle is_available conversion
    let isAvailableBoolean;
    if (is_available !== undefined) {
      if (typeof is_available === "string") {
        isAvailableBoolean = is_available.toLowerCase() === "true";
      } else if (typeof is_available === "boolean") {
        isAvailableBoolean = is_available;
      } else {
        isAvailableBoolean = Boolean(is_available);
      }
    } else {
      isAvailableBoolean = true; // default value
    }

    // Handle image URL - PERBAIKAN: Biarkan null jika tidak ada file
    let image_url = null;
    if (req.file) {
      image_url = req.file.filename;
      console.log("Image file saved:", image_url);
    } else {
      console.log("No image file uploaded, image_url will be null");
    }

    const productData = {
      name: name.trim(),
      description: description ? description.trim() : "",
      price: priceNum,
      category_id: categoryIdNum,
      image_url, // Bisa null atau string
      is_available: isAvailableBoolean,
      created_by: req.user.id,
    };

    console.log("Product data to create:", productData);

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      is_available,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    // Handle is_available conversion for filter
    let isAvailableFilter;
    if (is_available !== undefined) {
      if (typeof is_available === "string") {
        isAvailableFilter = is_available.toLowerCase() === "true";
      } else {
        isAvailableFilter = Boolean(is_available);
      }
    }

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      category_id,
      is_available: isAvailableFilter,
      search,
      sort_by,
      sort_order,
    };

    const result = await Product.findAll(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category_id,
      is_available,
      remove_image,
    } = req.body;

    console.log("Update request body:", req.body);
    console.log("Update request file:", req.file);

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Build update data object - hanya field yang dikirim
    const updateData = {};

    // Update name jika ada
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Update description jika ada
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    // Validasi dan update price jika ada
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number greater than 0",
        });
      }
      updateData.price = priceNum;
    }

    // Update category_id jika ada
    if (category_id !== undefined) {
      updateData.category_id = parseInt(category_id);
    }

    // Handle is_available conversion - HANYA JIKA DIKIRIM
    if (is_available !== undefined) {
      let isAvailableBoolean;
      if (typeof is_available === "string") {
        isAvailableBoolean = is_available.toLowerCase() === "true";
      } else if (typeof is_available === "boolean") {
        isAvailableBoolean = is_available;
      } else if (typeof is_available === "number") {
        isAvailableBoolean = is_available === 1;
      } else {
        isAvailableBoolean = Boolean(is_available);
      }
      updateData.is_available = isAvailableBoolean;
      console.log("Converted is_available:", isAvailableBoolean);
    }

    // Handle image URL
    if (remove_image === "true" || remove_image === true) {
      console.log("Removing existing image, setting image_url to null");
      updateData.image_url = null;
    } else if (req.file) {
      console.log("Updating with new image:", req.file.filename);
      updateData.image_url = req.file.filename;
    }
    // Jika tidak ada remove_image dan tidak ada req.file,
    // maka image_url tidak diubah (tidak ditambahkan ke updateData)

    console.log("Final update data:", updateData);

    const product = await Product.update(id, updateData);

    if (!product) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found or failed to update",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isDeleted = await Product.delete(id);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found or failed to delete",
      });
    }

    res.json({
      success: true,
      message: "Product deleted permanently",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
