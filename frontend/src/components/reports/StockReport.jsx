import React, { useState, useEffect } from "react";
import {
  Filter,
  Search,
  ArrowUpDown,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  BarChart3,
  PieChart,
  RefreshCw,
  Lock,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
} from "lucide-react";
import reportService from "../../services/reportService";

const StockReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    category_id: "",
    low_stock_threshold: 10,
    sort_by: "total_sold",
    sort_order: "DESC",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchStockReport();
  }, [filters]);

  const fetchStockReport = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching stock report...");
      const response = await reportService.getStockReport(filters);
      console.log("API Response:", response);

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching stock report:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTime");
        setError("Sesi Anda telah berakhir. Silakan login kembali.");

        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("Network Error")
      ) {
        setError("Koneksi jaringan terputus. Periksa koneksi internet Anda.");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Terjadi kesalahan saat memuat data"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await reportService.downloadStockCSV(filters);

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan-stok-penjualan-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);

      if (error.response?.status === 401) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = "/login";
      } else {
        alert(
          "Gagal mengunduh CSV: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await reportService.downloadStockPDF(filters);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan-stok-penjualan-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);

      if (error.response?.status === 401) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = "/login";
      } else {
        alert(
          "Gagal mengunduh PDF: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const getStockStatus = (stock, threshold = 10) => {
    if (stock === 0) return "Habis";
    if (stock <= threshold) return "Menipis";
    return "Aman";
  };

  const getStockStatusBadge = (stock) => {
    const status = getStockStatus(stock, filters.low_stock_threshold);

    const config = {
      Habis: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Stok Habis",
      },
      Menipis: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
        label: "Stok Menipis",
      },
      Aman: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Stok Aman",
      },
    };

    const { color, icon: Icon, label } = config[status];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const getSalesTrend = (totalSold, transactionCount) => {
    if (totalSold === 0)
      return { label: "Belum Terjual", color: "text-gray-500" };
    if (totalSold >= 100)
      return { label: "Sangat Laris", color: "text-green-600" };
    if (totalSold >= 50) return { label: "Laris", color: "text-green-500" };
    if (totalSold >= 10) return { label: "Sedang", color: "text-blue-500" };
    return { label: "Jarang", color: "text-orange-500" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Memuat data laporan stok dan penjualan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          {error.includes("Token") || error.includes("Sesi") ? (
            <Lock className="w-8 h-8 text-red-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-red-600" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        {!error.includes("login kembali") &&
          !error.includes("Token tidak ditemukan") && (
            <button
              onClick={fetchStockReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </button>
          )}
        {(error.includes("login kembali") ||
          error.includes("Token tidak ditemukan")) && (
          <p className="text-sm text-gray-600 mt-2">
            Mengalihkan ke halaman login...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Laporan Stok & Penjualan Produk
          </h2>
          <p className="text-gray-600">
            Analisis stok dan performa penjualan produk
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Laporan
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutkan Berdasarkan
            </label>
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="total_sold">Total Terjual</option>
              <option value="revenue">Pendapatan</option>
              <option value="transaction_count">Jumlah Transaksi</option>
              <option value="stock_quantity">Jumlah Stok</option>
              <option value="name">Nama Produk</option>
              <option value="price">Harga</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutan
            </label>
            <select
              value={filters.sort_order}
              onChange={(e) =>
                setFilters({ ...filters, sort_order: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DESC">Tertinggi ke Terendah</option>
              <option value="ASC">Terendah ke Tertinggi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({
                page: 1,
                limit: 10,
                category_id: "",
                low_stock_threshold: 10,
                sort_by: "total_sold",
                sort_order: "DESC",
                start_date: "",
                end_date: "",
              });
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {data?.sales_statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Produk Terjual
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.sales_statistics.total_products_sold || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Item Terjual
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.sales_statistics.total_items_sold || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Pendapatan
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.sales_statistics.total_revenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata per Transaksi
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.sales_statistics.avg_quantity_per_transaction?.toFixed(
                    1
                  ) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products Section */}
      {data?.top_products && data.top_products.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Produk Terlaris
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {data.top_products.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-medium text-green-600">
                        {product.total_sold} terjual
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Detail Stok & Penjualan
          </h3>
          <div className="text-sm text-gray-500">
            Menampilkan {data?.products?.length || 0} dari{" "}
            {data?.pagination?.total || 0} produk
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terjual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendapatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tren
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Stok
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.products?.map((product) => {
                const trend = getSalesTrend(
                  product.total_sold,
                  product.transaction_count
                );
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`font-semibold ${
                          product.stock_quantity === 0
                            ? "text-red-600"
                            : product.stock_quantity <=
                              filters.low_stock_threshold
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="font-semibold">
                          {product.total_sold || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 text-purple-500 mr-1" />
                        <span>{product.transaction_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                        <span className="font-semibold">
                          {formatCurrency(product.revenue || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-medium ${trend.color}`}>
                        {trend.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockStatusBadge(product.stock_quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(!data?.products || data.products.length === 0) && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data produk</p>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Halaman {data.pagination.page} dari {data.pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: data.pagination.page - 1 })
                }
                disabled={data.pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: data.pagination.page + 1 })
                }
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockReport;
