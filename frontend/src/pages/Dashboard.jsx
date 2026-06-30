import { useState, useEffect } from "react";
import { api } from "../services/authService";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayTransactions: 0,
    todayProducts: 0,
    totalAvailableProducts: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Fetch today's transactions
      const transactionsResponse = await api.get("/transactions", {
        params: {
          start_date: today,
          end_date: today,
          limit: 5,
          sort_by: "created_at",
          sort_order: "DESC",
        },
      });

      // Fetch transaction statistics for today
      const statsResponse = await api.get("/reports/transactions", {
        params: {
          start_date: today,
          end_date: today,
          limit: 1,
        },
      });

      // Fetch available products (is_available = true)
      const productsResponse = await api.get("/products", {
        params: {
          is_available: true,
          limit: 10, // Limit to 10 products for the dashboard
          sort_by: "created_at",
          sort_order: "DESC",
        },
      });

      // Process transactions data
      const transactionsData =
        transactionsResponse.data.data.transactions || [];
      const statisticsData = statsResponse.data.data.statistics || {};
      const productsData = productsResponse.data.data.products || [];

      // Calculate total available products
      const totalAvailableProducts = productsData.length;

      // Calculate total products sold today
      const totalProductsSold = transactionsData.reduce((sum, transaction) => {
        return sum + (transaction.items?.length || 0);
      }, 0);

      setStats({
        todayRevenue: statisticsData.total_revenue || 0,
        todayTransactions: statisticsData.total_transactions || 0,
        todayProducts: totalProductsSold,
        totalAvailableProducts: totalAvailableProducts,
      });

      setRecentTransactions(transactionsData);
      setAvailableProducts(productsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
    };
  };

  const getProductStatus = (product) => {
    if (!product.is_available) {
      return { text: "Tidak Tersedia", color: "bg-red-100 text-red-800" };
    } else {
      return { text: "Tersedia", color: "bg-green-100 text-green-800" };
    }
  };

  const statsConfig = [
    {
      title: "Total Penjualan Hari Ini",
      value: formatCurrency(stats.todayRevenue),
      icon: (
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1m0-1h-1m1 0h1"
          />
        </svg>
      ),
    },
    {
      title: "Total Transaksi",
      value: stats.todayTransactions.toString(),
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      title: "Produk Terjual",
      value: stats.todayProducts.toString(),
      icon: (
        <svg
          className="w-8 h-8 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      title: "Produk Tersedia",
      value: stats.totalAvailableProducts.toString(),
      icon: (
        <svg
          className="w-8 h-8 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Selamat datang di sistem kasir toko Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaksi Terbaru
          </h3>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const datetime = formatDateTime(transaction.created_at);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.invoice_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {datetime.time} •{" "}
                        {formatCurrency(transaction.total_amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {transaction.customer_name} •{" "}
                        {transaction.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Selesai
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Belum ada transaksi hari ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Produk Tersedia
            </h3>
            <span className="text-sm text-gray-500">
              Menampilkan {availableProducts.length} produk
            </span>
          </div>
          <div className="space-y-4">
            {availableProducts.length > 0 ? (
              availableProducts.map((product) => {
                const productStatus = getProductStatus(product);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {product.category_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${productStatus.color}`}
                      >
                        {productStatus.text}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
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
                <p>Belum ada produk yang tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
