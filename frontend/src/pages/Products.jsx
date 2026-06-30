import { useState, useEffect } from "react";
import ProductList from "../components/products/ProductList";
import ProductModal from "../components/products/ProductModal";
import { productService } from "../services/productService";
import { authService } from "../services/authService"; // IMPORT AUTH SERVICE
import { toast } from "react-toastify";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  // Tambahkan kontrol akses
  const currentUser = authService.getCurrentUser();
  const isOwner = currentUser?.role === "pemilik";

  // Load products and categories
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category_id = selectedCategory;

      console.log("Loading products with filters:", filters);

      const response = await productService.getProducts(filters);

      if (response.success) {
        // Handle both array and paginated response
        const productsData = response.data?.products || response.data || [];
        setProducts(productsData);
        console.log("Products loaded:", productsData.length);
      } else {
        toast.error(response.message || "Gagal memuat produk");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      const errorMessage =
        error.response?.data?.message || "Terjadi kesalahan saat memuat produk";
      toast.error(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log("Loading categories...");
      const response = await productService.getCategories();
      console.log("Categories response:", response);

      if (response.success) {
        // Handle different response structures
        const categoriesData = response.data?.categories || response.data || [];

        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setCategories(categoriesData);
          console.log("Categories loaded:", categoriesData);
        } else {
          console.warn("No categories found or invalid format");
          setCategories([]);
        }
      } else {
        console.warn("Failed to load categories:", response);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      console.error("Error details:", error.response?.data);
      // Don't show toast for categories error to avoid confusion
      setCategories([]);
    }
  };

  // Reload when filters change
  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory]);

  const handleAddProduct = () => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menambah produk");
      return;
    }
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat mengedit produk");
      return;
    }
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleSaveProduct = async (productData) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menyimpan produk");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving product data:", productData);

      // Validasi required fields
      if (!productData.name?.trim()) {
        toast.error("Nama produk harus diisi");
        return;
      }
      if (!productData.price || productData.price <= 0) {
        toast.error("Harga harus lebih dari 0");
        return;
      }
      if (!productData.category_id) {
        toast.error("Kategori harus dipilih");
        return;
      }

      let response;

      // Coba dengan simple create dulu (tanpa FormData)
      if (
        !editingProduct &&
        (!productData.image || !(productData.image instanceof File))
      ) {
        console.log("Using simple create without image");
        response = await productService.createSimpleProduct(productData);
      } else if (editingProduct) {
        response = await productService.updateProduct(
          editingProduct.id,
          productData
        );
      } else {
        response = await productService.createProduct(productData);
      }

      console.log("Save response:", response);

      if (response.success) {
        toast.success(
          editingProduct
            ? "Produk berhasil diupdate"
            : "Produk berhasil ditambahkan"
        );
        setShowModal(false);
        setEditingProduct(null);
        await loadProducts();
      } else {
        const errorMessage =
          response.message || "Terjadi kesalahan saat menyimpan";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving product:", error);

      let errorMessage = "Terjadi kesalahan saat menyimpan produk";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.message) {
          errorMessage = errorData.message;
        }

        // Handle validation errors dari backend
        if (errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors.join(", ");
        }

        // Handle error specific cases
        if (errorData.success === false) {
          errorMessage = errorData.message || "Request gagal";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menghapus produk");
      return;
    }

    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        const response = await productService.deleteProduct(productId);
        if (response.success) {
          toast.success("Produk berhasil dihapus");
          await loadProducts();
        } else {
          toast.error(response.message || "Gagal menghapus produk");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Terjadi kesalahan saat menghapus produk";
        toast.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditingProduct(null);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-600 mt-2">
            {isOwner
              ? "Kelola produk dan inventori toko Anda"
              : "Lihat daftar produk toko"}
          </p>
          {!isOwner && (
            <p className="text-sm text-yellow-600 mt-1">
              Mode view only - hanya pemilik yang dapat mengubah data
            </p>
          )}
        </div>

        {/* Hanya tampilkan tombol tambah untuk pemilik */}
        {isOwner && (
          <button
            onClick={handleAddProduct}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Tambah Produk</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Produk
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama atau deskripsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">
              Menampilkan {Array.isArray(products) ? products.length : 0} produk
            </span>
          </div>
          <button
            onClick={loadProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products List - Kirim prop isOwner */}
      <ProductList
        products={products}
        loading={loading}
        onEdit={isOwner ? handleEditProduct : null} // Hanya kirim fungsi jika owner
        onDelete={isOwner ? handleDeleteProduct : null} // Hanya kirim fungsi jika owner
        isOwner={isOwner} // Kirim status owner ke ProductList
      />

      {/* Product Modal - hanya untuk pemilik */}
      {isOwner && (
        <ProductModal
          isOpen={showModal}
          onClose={handleCloseModal}
          product={editingProduct}
          onSave={handleSaveProduct}
          loading={saving}
          categories={categories}
        />
      )}
    </div>
  );
};

export default Products;
