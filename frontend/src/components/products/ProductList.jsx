import { useState } from "react";

const ProductList = ({ products, loading, onEdit, onDelete, isOwner }) => {
  // TAMBAHKAN PROPS isOwner
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Handle both array response and paginated response
  const productsArray = Array.isArray(products)
    ? products
    : products?.products || [];

  if (productsArray.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak ada produk
        </h3>
        <p className="text-gray-500 mb-4">
          Belum ada produk yang ditambahkan atau tidak ada yang cocok dengan
          filter.
        </p>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAvailabilityColor = (isAvailable) => {
    return isAvailable
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  // Function to handle image error
  const handleImageError = (e, productId) => {
    console.error(
      `❌ Image failed to load for product ${productId}:`,
      e.target.src
    );

    // Update loading state
    setImageLoadingStates((prev) => ({
      ...prev,
      [productId]: "error",
    }));

    // Hide the failed image
    e.target.style.display = "none";
  };

  // Function to handle image load
  const handleImageLoad = (e, productId) => {
    console.log(
      `✅ Image loaded successfully for product ${productId}:`,
      e.target.src
    );

    // Update loading state
    setImageLoadingStates((prev) => ({
      ...prev,
      [productId]: "loaded",
    }));
  };

  // Function to handle image load start
  const handleImageLoadStart = (productId) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [productId]: "loading",
    }));
  };

  // Fix URL gambar
  const getOptimizedImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return null;
    }

    // Jika backend sudah memberikan full URL, gunakan langsung
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // Jika backend hanya memberikan filename, construct URL
    const baseUrl = window.location.origin;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Coba beberapa kemungkinan path
    const possiblePaths = [
      `${apiUrl}/uploads/products/${imageUrl}`,
      `${baseUrl}/uploads/products/${imageUrl}`,
      `${apiUrl}${imageUrl}`,
      `${baseUrl}${imageUrl}`,
    ];

    return possiblePaths[0];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gambar
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produk
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* Hanya tampilkan kolom aksi untuk pemilik */}
              {isOwner && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productsArray.map((product) => {
              const optimizedImageUrl = getOptimizedImageUrl(product.image_url);
              const imageState = imageLoadingStates[product.id] || "initial";

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      {optimizedImageUrl ? (
                        <div className="relative">
                          {/* Loading Indicator - Hanya muncul saat loading */}
                          {imageState === "loading" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-lg z-10">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                            </div>
                          )}

                          {/* Main Image */}
                          <img
                            src={optimizedImageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-white"
                            onError={(e) => handleImageError(e, product.id)}
                            onLoad={(e) => handleImageLoad(e, product.id)}
                            onLoadStart={() => handleImageLoadStart(product.id)}
                            loading="lazy"
                            crossOrigin="anonymous"
                            style={{
                              display:
                                imageState === "error" ? "none" : "block",
                            }}
                          />

                          {/* Fallback Icon - Muncul hanya jika error */}
                          {imageState === "error" && (
                            <div className="absolute inset-0 w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
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
                            </div>
                          )}
                        </div>
                      ) : (
                        // Default fallback ketika tidak ada image URL
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                        {product.description || "Tidak ada deskripsi"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {product.category_name || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(
                        product.is_available
                      )}`}
                    >
                      {product.is_available ? "Tersedia" : "Tidak Tersedia"}
                    </span>
                  </td>
                  {/* Hanya tampilkan tombol aksi untuk pemilik */}
                  {isOwner && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEdit && onEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                          title="Edit Produk"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(product.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                          title="Hapus Produk"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
