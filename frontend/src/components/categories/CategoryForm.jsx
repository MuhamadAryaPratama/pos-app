import { useState, useEffect } from "react";

const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama kategori harus diisi";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama kategori minimal 2 karakter";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Nama kategori maksimal 50 karakter";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi kategori harus diisi";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Deskripsi kategori minimal 10 karakter";
    } else if (formData.description.trim().length > 500) {
      newErrors.description = "Deskripsi kategori maksimal 500 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Kategori <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
          placeholder="Masukkan nama kategori"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.name.length}/50 karakter
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Kategori <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
          placeholder="Masukkan deskripsi kategori..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/500 karakter. Minimal 10 karakter.
        </p>
      </div>

      {/* Category Info */}
      {category && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Informasi Kategori
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Jumlah Produk:</span>
              <p className="font-medium text-gray-900">
                {category.productCount || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Dibuat Pada:</span>
              <p className="font-medium text-gray-900">
                {category.createdAt
                  ? new Date(category.createdAt).toLocaleDateString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{category ? "Update Kategori" : "Simpan Kategori"}</span>
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
