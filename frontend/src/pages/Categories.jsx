import { useState, useEffect } from "react";
import CategoryList from "../components/categories/CategoryList";
import CategoryModal from "../components/categories/CategoryModal";
import { categoriesService } from "../services/categoriesService";
import { authService } from "../services/authService";
import { toast } from "react-toastify";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const currentUser = authService.getCurrentUser();
  const isOwner = currentUser?.role === "pemilik";

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching categories...");
      const response = await categoriesService.getAllCategories();
      console.log("Categories response:", response);

      // Perbaikan: Handle struktur response yang berbeda
      if (response.success) {
        let categoriesData = [];

        // Cek berbagai kemungkinan struktur response
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories;
        } else if (Array.isArray(response.data?.data)) {
          categoriesData = response.data.data;
        } else {
          console.error("Unknown response structure:", response);
          setError("Struktur data tidak dikenali");
          toast.error("Gagal memuat data kategori");
          setCategories([]);
          return;
        }

        // Format categories data to match frontend expectations
        const formattedCategories = categoriesData.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description || "",
          // Untuk karyawan, productCount mungkin tidak tersedia
          productCount: category.product_count || category.productCount || 0,
          createdAt: category.created_at || category.createdAt,
          createdByName: category.created_by_name || category.createdByName,
          ...category,
        }));

        setCategories(formattedCategories);
        console.log("Formatted categories loaded:", formattedCategories);
      } else {
        console.error("API returned error:", response);
        setError(response.message || "Gagal memuat data kategori");
        toast.error(response.message || "Gagal memuat data kategori");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setError(error.message || "Terjadi kesalahan");
      toast.error("Terjadi kesalahan saat memuat kategori");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menambah kategori");
      return;
    }
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat mengedit kategori");
      return;
    }
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleSaveCategory = async (categoryData) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menyimpan kategori");
      return;
    }

    try {
      let response;
      if (editingCategory) {
        response = await categoriesService.updateCategory(
          editingCategory.id,
          categoryData
        );
        if (response.success) {
          toast.success("Kategori berhasil diperbarui");
          loadCategories();
        } else {
          toast.error(response.message || "Gagal memperbarui kategori");
          return;
        }
      } else {
        response = await categoriesService.createCategory(categoryData);
        if (response.success) {
          toast.success("Kategori berhasil ditambahkan");
          loadCategories();
        } else {
          toast.error(response.message || "Gagal menambahkan kategori");
          return;
        }
      }
      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Terjadi kesalahan saat menyimpan kategori");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!isOwner) {
      toast.warning("Hanya pemilik yang dapat menghapus kategori");
      return;
    }

    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) {
      toast.error("Kategori tidak ditemukan");
      return;
    }

    // Untuk karyawan, productCount mungkin 0, jadi kita skip pengecekan ini
    if (isOwner && category.productCount > 0) {
      toast.warning(
        `Tidak dapat menghapus kategori "${category.name}" karena masih memiliki ${category.productCount} produk.`
      );
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`
      )
    ) {
      try {
        const response = await categoriesService.deleteCategory(categoryId);
        if (response.success) {
          toast.success("Kategori berhasil dihapus");
          loadCategories();
        } else {
          toast.error(response.message || "Gagal menghapus kategori");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Terjadi kesalahan saat menghapus kategori");
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get statistics - hanya untuk pemilik
  const totalCategories = categories.length;
  const totalProducts = isOwner
    ? categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)
    : 0;

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Kategori Produk
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola kategori produk toko Anda
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Memuat Data
          </h3>
          <p className="text-gray-500 mb-4">
            {error || "Terjadi kesalahan saat memuat data kategori."}
          </p>
          <button
            onClick={loadCategories}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori Produk</h1>
          <p className="text-gray-600 mt-2">
            {isOwner
              ? "Kelola kategori produk toko Anda"
              : "Lihat daftar kategori produk"}
          </p>
          {!isOwner && (
            <p className="text-sm text-yellow-600 mt-1">
              Mode view only - hanya pemilik yang dapat mengubah data
            </p>
          )}
        </div>

        {isOwner && (
          <button
            onClick={handleAddCategory}
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
            <span>Tambah Kategori</span>
          </button>
        )}
      </div>

      {/* Stats Cards - hanya untuk pemilik */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Kategori
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalCategories}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Produk
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalProducts}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Produk/Kategori
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalCategories > 0
                    ? Math.round(totalProducts / totalCategories)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cari Kategori
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
      </div>

      {/* Categories List */}
      <CategoryList
        categories={filteredCategories}
        loading={loading}
        onEdit={isOwner ? handleEditCategory : null}
        onDelete={isOwner ? handleDeleteCategory : null}
        isOwner={isOwner}
      />

      {/* Category Modal - hanya untuk pemilik */}
      {isOwner && (
        <CategoryModal
          isOpen={showModal}
          onClose={handleCloseModal}
          category={editingCategory}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};

export default Categories;
