// ./src/components/products/ProductForm.jsx
import { useState, useEffect } from "react";

const ProductForm = ({
  product,
  onSave,
  onCancel,
  loading,
  categories,
  isOwner = true,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    image: null,
    remove_image: false,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    console.log("ProductForm received product:", product);

    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category_id: product.category_id || "",
        is_available:
          product.is_available !== undefined ? product.is_available : true,
        image: null,
        remove_image: false,
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        is_available: true,
        image: null,
        remove_image: false,
      });
      setImagePreview("");
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama produk harus diisi";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Kategori harus dipilih";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Harga harus lebih dari 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isOwner) {
      alert("Hanya pemilik yang dapat menyimpan produk");
      return;
    }

    if (validateForm()) {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        is_available: Boolean(formData.is_available),
      };

      // Handle image removal
      if (formData.remove_image && !formData.image) {
        submitData.remove_image = true;
      }

      console.log("Submitting product data:", {
        ...submitData,
        is_available: submitData.is_available,
        is_available_type: typeof submitData.is_available,
      });

      onSave(submitData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      console.log(`Checkbox ${name} changed to:`, checked);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        alert("Hanya file gambar yang diizinkan");
        return;
      }

      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
        remove_image: false,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      remove_image: true,
    }));
    setImagePreview("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isOwner || loading}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            } ${!isOwner ? "bg-gray-100 cursor-not-allowed" : ""}`}
            placeholder="Masukkan nama produk"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            disabled={!isOwner || loading}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.category_id ? "border-red-500" : "border-gray-300"
            } ${!isOwner ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            <option value="">Pilih Kategori</option>
            {Array.isArray(categories) &&
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Harga (Rp) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            disabled={!isOwner || loading}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.price ? "border-red-500" : "border-gray-300"
            } ${!isOwner ? "bg-gray-100 cursor-not-allowed" : ""}`}
            placeholder="0"
            min="0"
            step="0.01"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center">
          <label className="flex items-center space-x-2 mt-6">
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              disabled={!isOwner || loading}
              className={`rounded border-gray-300 text-green-600 focus:ring-green-500 ${
                !isOwner ? "cursor-not-allowed" : ""
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              Produk Tersedia
            </span>
          </label>
        </div>

        {/* Image Upload - Hanya untuk pemilik */}
        {isOwner && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Produk
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={loading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="hidden"
                />
                <div
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors duration-200 ${
                    !loading ? "hover:border-green-500" : ""
                  }`}
                >
                  <svg
                    className="w-8 h-8 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Klik untuk upload gambar
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG (max. 5MB)
                  </p>
                </div>
              </label>
            </div>
            {product?.image_url && !imagePreview && !formData.remove_image && (
              <p className="text-sm text-gray-500 mt-2">
                Gambar saat ini: {product.image_url}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Produk
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={!isOwner || loading}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
            !isOwner ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
          }`}
          placeholder="Deskripsi produk (opsional)"
        />
      </div>

      {/* Form Actions - Hanya untuk pemilik */}
      {isOwner && (
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{product ? "Update Produk" : "Simpan Produk"}</span>
          </button>
        </div>
      )}

      {/* Info untuk karyawan */}
      {!isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
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
            <p className="text-sm text-yellow-800">
              Mode view only - Hanya pemilik yang dapat mengubah data produk
            </p>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
