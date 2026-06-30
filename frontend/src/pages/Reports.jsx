import React, { useState, useEffect } from "react";
import { BarChart3, Package } from "lucide-react";
import StockReport from "../components/reports/StockReport";
import TransactionReport from "../components/reports/TransactionReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("stock");
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "stock", name: "Laporan Stok", icon: Package },
    { id: "transaction", name: "Transaksi", icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "stock":
        return <StockReport />;
      case "transaction":
        return <TransactionReport />;
      case "alerts":
        return <StockAlerts />;
      default:
        return <StockReport />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Laporan & Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                Pantau dan kelola inventaris produk dengan insights yang detail
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
