import React, { useState, useEffect } from "react";
import {
  Filter,
  Download,
  Calendar,
  User,
  CreditCard,
  BarChart3,
  RefreshCw,
  Eye,
  Receipt,
  DollarSign,
  TrendingUp,
  Wallet,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import reportService from "../../services/reportService";

const TransactionReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    start_date: "",
    end_date: "",
    payment_method: "",
    cashier_id: "",
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split("T")[0];

    setFilters((prev) => ({
      ...prev,
      start_date: startDateStr,
      end_date: endDate,
    }));
  }, []);

  useEffect(() => {
    fetchTransactionReport();
  }, [filters]);

  const fetchTransactionReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportService.getTransactionReport(filters);
      console.log("Transaction report data:", response.data);

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching transaction report:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTime");
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
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
      const response = await reportService.downloadTransactionCSV(filters);

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan-transaksi-${new Date().toISOString().split("T")[0]}.csv`
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
      const response = await reportService.downloadTransactionPDF(filters);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan-transaksi-${new Date().toISOString().split("T")[0]}.pdf`
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

  const handleDownloadDetailPDF = async (transaction) => {
    try {
      const response = await reportService.downloadTransactionDetailPDF(
        transaction.id
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `detail-transaksi-${transaction.invoice_number}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading detail PDF:", error);

      if (error.response?.status === 401) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = "/login";
      } else if (error.response?.status === 404) {
        alert("Data transaksi tidak ditemukan.");
      } else {
        alert(
          "Gagal mengunduh detail transaksi: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return "Rp 0";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const getPaymentMethodBadge = (method) => {
    const config = {
      cash: {
        color: "bg-green-100 text-green-800 border border-green-200",
        label: "CASH",
        icon: DollarSign,
      },
      qris: {
        color: "bg-blue-100 text-blue-800 border border-blue-200",
        label: "QRIS",
        icon: CreditCard,
      },
      transfer: {
        color: "bg-purple-100 text-purple-800 border border-purple-200",
        label: "TRANSFER",
        icon: TrendingUp,
      },
    };

    const {
      color,
      label,
      icon: Icon,
    } = config[method] || {
      color: "bg-gray-100 text-gray-800 border border-gray-200",
      label: method?.toUpperCase() || "UNKNOWN",
      icon: CreditCard,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  // Get payment statistics dari backend
  const getPaymentStats = () => {
    if (!data?.statistics) return null;

    const stats = data.statistics;

    return {
      totalCashAmount: stats.cash_total_amount || 0,
      totalQrisAmount: stats.qris_total_amount || 0,
      totalCashTransactions: stats.cash_transactions || 0,
      totalQrisTransactions: stats.qris_transactions || 0,
      totalTransactions: stats.total_transactions || 0,
      qrisPercentage:
        stats.total_transactions > 0
          ? (stats.qris_transactions / stats.total_transactions) * 100
          : 0,
      cashPercentage:
        stats.total_transactions > 0
          ? (stats.cash_transactions / stats.total_transactions) * 100
          : 0,
      averageTransaction: stats.average_transaction || 0,
    };
  };

  const paymentStats = getPaymentStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            {error.includes("Token") || error.includes("Sesi") ? (
              <X className="w-8 h-8 text-red-600" />
            ) : (
              <BarChart3 className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Terjadi Kesalahan
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          {!error.includes("login kembali") &&
            !error.includes("Token tidak ditemukan") && (
              <button
                onClick={fetchTransactionReport}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center transition-colors shadow-sm"
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Transaksi
          </h1>
          <p className="text-gray-600 mt-1">
            Pantau dan analisis data transaksi penjualan
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transactions Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Transaksi
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.statistics?.total_transactions?.toLocaleString(
                  "id-ID"
                ) || 0}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Semua metode pembayaran
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Pendapatan
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(data?.statistics?.total_revenue || 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            Pendapatan kotor
          </div>
        </div>

        {/* Cash Transactions Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Transaksi Cash
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.statistics?.cash_transactions?.toLocaleString("id-ID") ||
                  0}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {formatCurrency(data?.statistics?.cash_total_amount || 0)}
          </div>
        </div>

        {/* QRIS Transactions Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Transaksi QRIS
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.statistics?.qris_transactions?.toLocaleString("id-ID") ||
                  0}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {formatCurrency(data?.statistics?.qris_total_amount || 0)}
          </div>
        </div>
      </div>

      {/* Additional Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* QRIS Percentage */}
          <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Persentase QRIS
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {paymentStats.qrisPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {paymentStats.totalQrisTransactions?.toLocaleString("id-ID")} dari{" "}
              {paymentStats.totalTransactions?.toLocaleString("id-ID")}{" "}
              transaksi
            </div>
          </div>

          {/* Cash Percentage */}
          <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Persentase Cash
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {paymentStats.cashPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {paymentStats.totalCashTransactions?.toLocaleString("id-ID")} dari{" "}
              {paymentStats.totalTransactions?.toLocaleString("id-ID")}{" "}
              transaksi
            </div>
          </div>

          {/* Average Transaction */}
          <div className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Transaksi
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(paymentStats.averageTransaction)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">Per transaksi</div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Filter Laporan
          </h3>
          <button
            onClick={fetchTransactionReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Terapkan Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  start_date: e.target.value,
                  page: 1,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  end_date: e.target.value,
                  page: 1,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Metode Pembayaran
            </label>
            <select
              value={filters.payment_method}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  payment_method: e.target.value,
                  page: 1,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Metode</option>
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                const endDate = new Date().toISOString().split("T")[0];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                const startDateStr = startDate.toISOString().split("T")[0];

                setFilters({
                  page: 1,
                  limit: 10,
                  start_date: startDateStr,
                  end_date: endDate,
                  payment_method: "",
                  cashier_id: "",
                });
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Daftar Transaksi
          </h3>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
            Menampilkan{" "}
            <span className="font-semibold text-gray-700">
              {data?.transactions?.length || 0}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-700">
              {data?.pagination?.total?.toLocaleString("id-ID") || 0}
            </span>{" "}
            transaksi
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Kasir
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Metode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.transactions?.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-blue-600">
                      {transaction.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatShortDate(transaction.created_at)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(transaction.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {transaction.cashier_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.customer_name || (
                        <span className="text-gray-400">Guest</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentMethodBadge(transaction.payment_method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(transaction)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!data?.transactions || data.transactions.length === 0) && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Tidak ada data transaksi</p>
            <p className="text-gray-400 text-sm mt-1">
              Coba ubah filter atau periode waktu
            </p>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-sm text-gray-700">
              Halaman{" "}
              <span className="font-semibold">{data.pagination.page}</span> dari{" "}
              <span className="font-semibold">
                {data.pagination.totalPages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: data.pagination.page - 1 })
                }
                disabled={data.pagination.page <= 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </button>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: data.pagination.page + 1 })
                }
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Berikutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Detail Transaksi
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownloadDetailPDF(selectedTransaction)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Invoice</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedTransaction.invoice_number}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Tanggal</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatDate(selectedTransaction.created_at)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Waktu</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatTime(selectedTransaction.created_at)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Kasir</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedTransaction.cashier_name}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Pelanggan</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedTransaction.customer_name || (
                      <span className="text-gray-500">Guest</span>
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">
                    Metode Pembayaran
                  </p>
                  <div className="mt-1">
                    {getPaymentMethodBadge(selectedTransaction.payment_method)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Item yang Dibeli
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                          Harga
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(
                              item.subtotal || item.quantity * item.price
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Ringkasan Pembayaran
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatCurrency(selectedTransaction.subtotal_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      PPN (10%):
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {formatCurrency(selectedTransaction.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-gray-900 font-bold text-lg">
                      Total:
                    </span>
                    <span className="text-gray-900 font-bold text-lg">
                      {formatCurrency(selectedTransaction.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">Dibayar:</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(selectedTransaction.paid_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-blue-600 font-bold">Kembali:</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(selectedTransaction.change_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionReport;
