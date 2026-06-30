// frontend/src/pages/QRISConfirmation.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  User,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Printer,
  X,
  Package,
  Bluetooth,
} from "lucide-react";
import { transactionService } from "../services/transactionService";
import { bluetoothPrintService } from "../services/bluetoothPrintService";

const QRISConfirmation = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState("disconnected");
  const receiptRef = useRef();

  useEffect(() => {
    fetchPendingTransactions();
    checkBluetoothSupport();
  }, []);

  // Fungsi untuk cek Bluetooth support
  const checkBluetoothSupport = () => {
    if (!navigator.bluetooth) {
      console.warn("Web Bluetooth tidak didukung di browser ini");
      setBluetoothStatus("not-supported");
    }
  };

  // Fungsi untuk format currency display (sama seperti di CashierTransaction)
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Fungsi untuk print ke Bluetooth (sama seperti di CashierTransaction)
  const handleBluetoothPrint = async (transaction) => {
    try {
      setPrintLoading(true);
      setBluetoothStatus("connecting");

      if (!navigator.bluetooth) {
        throw new Error(
          "Browser tidak mendukung Web Bluetooth API. Gunakan Chrome atau Edge versi terbaru."
        );
      }

      console.log("Memulai print ke printer Bluetooth...");
      await bluetoothPrintService.printReceipt(transaction);

      setBluetoothStatus("connected");
      console.log("✅ Nota berhasil dikirim ke printer!");
    } catch (error) {
      console.error("❌ Print error:", error);
      setBluetoothStatus("error");

      if (error.name === "NotFoundError") {
        throw new Error(
          "Printer Bluetooth tidak ditemukan. Pastikan printer RPP02N dalam mode pairing dan terdekat."
        );
      } else if (error.name === "NetworkError") {
        throw new Error(
          "Gagal terhubung ke printer. Periksa koneksi Bluetooth dan pastikan printer siap."
        );
      } else if (error.name === "SecurityError") {
        throw new Error(
          "Izin Bluetooth ditolak. Pastikan memberikan izin ketika diminta."
        );
      } else {
        throw new Error("Gagal mencetak: " + error.message);
      }
    } finally {
      setPrintLoading(false);
    }
  };

  // Test printer Bluetooth
  const testBluetoothPrinter = async () => {
    try {
      setPrintLoading(true);
      setBluetoothStatus("connecting");
      await bluetoothPrintService.testPrint();
      setBluetoothStatus("connected");
      alert("✅ Test print berhasil! Printer Bluetooth siap digunakan.");
    } catch (error) {
      console.error("Test print failed:", error);
      setBluetoothStatus("error");
      alert("❌ Test print gagal: " + error.message);
    } finally {
      setPrintLoading(false);
    }
  };

  // Update fungsi handlePrint dengan Bluetooth
  const handlePrint = async () => {
    if (!selectedTransaction) return;

    // Coba print ke Bluetooth terlebih dahulu
    try {
      await handleBluetoothPrint(selectedTransaction);
      alert("✅ Nota berhasil dikirim ke printer Bluetooth!");
    } catch (error) {
      console.log("Fallback ke print browser:", error);

      // Fallback ke print browser biasa
      const receiptContent = receiptRef.current;
      const printWindow = window.open("", "_blank");

      printWindow.document.write(`
        <html>
          <head>
            <title>Nota Transaksi - ${selectedTransaction.invoice_number}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 20px;
                font-size: 14px;
              }
              .receipt { 
                max-width: 300px; 
                margin: 0 auto;
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px;
              }
              .item { 
                margin-bottom: 8px; 
              }
              .total { 
                font-weight: bold; 
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse;
              }
              td { 
                padding: 4px 0;
              }
              .text-right { 
                text-align: right; 
              }
              .text-center { 
                text-align: center; 
              }
              .status-confirmed {
                color: #059669;
                font-weight: bold;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${receiptContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      alert("🖨️ Menggunakan print browser (fallback)");
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await transactionService.getPendingQRISTransactions();
      console.log("Pending QRIS transactions response:", response);

      let transactions = [];

      if (response.success) {
        if (response.data && response.data.transactions) {
          transactions = response.data.transactions;
        } else if (response.data && Array.isArray(response.data)) {
          transactions = response.data;
        } else if (Array.isArray(response.data)) {
          transactions = response.data;
        }
      }

      setPendingTransactions(transactions);
    } catch (error) {
      console.error("Error fetching pending QRIS transactions:", error);
      setError("Gagal memuat transaksi QRIS pending");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (transactionId) => {
    try {
      setProcessing((prev) => ({ ...prev, [transactionId]: "confirming" }));
      setError("");

      const response = await transactionService.confirmQRISPayment(
        transactionId
      );

      if (response.success) {
        // Set transaction untuk receipt
        setSelectedTransaction(response.data.transaction);
        setShowReceipt(true);

        // Refresh list setelah konfirmasi berhasil
        await fetchPendingTransactions();
      } else {
        throw new Error(response.message || "Gagal mengonfirmasi pembayaran");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      setError(
        error.message || "Terjadi kesalahan saat mengonfirmasi pembayaran"
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const cancelPayment = async (transactionId) => {
    try {
      setProcessing((prev) => ({ ...prev, [transactionId]: "cancelling" }));
      setError("");

      const response = await transactionService.cancelQRISPayment(
        transactionId
      );

      if (response.success) {
        // Refresh list setelah pembatalan berhasil
        await fetchPendingTransactions();
      } else {
        throw new Error(response.message || "Gagal membatalkan transaksi");
      }
    } catch (error) {
      console.error("Error canceling payment:", error);
      setError(error.message || "Terjadi kesalahan saat membatalkan transaksi");
    } finally {
      setProcessing((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getElapsedTime = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  // ReceiptDisplay yang konsisten dengan CashierTransaction
  const ReceiptDisplay = () => {
    if (!selectedTransaction) return null;

    return (
      <div ref={receiptRef} className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold mb-2">NOTA TRANSAKSI</h2>
        <p className="text-sm text-gray-600 mb-4">Toko Anda</p>

        <div className="border-t border-b border-dashed py-3 mb-3 text-left text-sm">
          <div className="flex justify-between mb-1">
            <span>No Invoice:</span>
            <span className="font-semibold">
              {selectedTransaction.invoice_number}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Tanggal:</span>
            <span>
              {new Date(selectedTransaction.created_at).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Kasir:</span>
            <span>{selectedTransaction.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span>{selectedTransaction.customer_name}</span>
          </div>
        </div>

        <div className="mb-3 text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedTransaction.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">
                    <div className="text-left">{item.product_name}</div>
                    <div className="text-xs text-gray-500 text-left">
                      {formatCurrency(item.price)}
                    </div>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right font-semibold">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed pt-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(selectedTransaction.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between mb-1 text-orange-600">
            <span>PPN (10%):</span>
            <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
          </div>
          <div className="flex justify-between mb-2 font-bold border-t pt-2">
            <span>TOTAL:</span>
            <span className="text-lg">
              {formatCurrency(selectedTransaction.total_amount)}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Metode:</span>
            <span className="uppercase">
              {selectedTransaction.payment_method}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Status:</span>
            <span className="text-green-600 font-semibold">Dikonfirmasi</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar:</span>
            <span>{formatCurrency(selectedTransaction.paid_amount)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Terima kasih atas kunjungan Anda!
        </p>
      </div>
    );
  };

  const filteredTransactions = pendingTransactions.filter(
    (transaction) =>
      transaction.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat transaksi pending...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                Konfirmasi Pembayaran QRIS
              </h1>
              <p className="text-gray-600 mt-2">
                Kelola dan konfirmasi pembayaran QRIS yang sedang menunggu
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchPendingTransactions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base font-medium text-gray-600">
                  Total Pending
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                  {pendingTransactions.length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base font-medium text-gray-600">
                  Total Nilai
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(
                    pendingTransactions.reduce(
                      (sum, transaction) =>
                        sum + parseFloat(transaction.total_amount || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base font-medium text-gray-600">
                  Transaksi Hari Ini
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                  {
                    pendingTransactions.filter((t) => {
                      const today = new Date().toDateString();
                      const transactionDate = new Date(
                        t.created_at
                      ).toDateString();
                      return today === transactionDate;
                    }).length
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan invoice, pelanggan, atau kasir..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="text-sm text-gray-600">
              Menampilkan {filteredTransactions.length} dari{" "}
              {pendingTransactions.length} transaksi
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 lg:py-16">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {pendingTransactions.length === 0
                  ? "Tidak ada transaksi QRIS pending"
                  : "Transaksi tidak ditemukan"}
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {pendingTransactions.length === 0
                  ? "Semua pembayaran QRIS telah dikonfirmasi."
                  : "Coba ubah kata kunci pencarian Anda."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 lg:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Transaction Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-blue-600" />
                          <span className="font-mono font-bold text-gray-900">
                            {transaction.invoice_number}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            Menunggu Konfirmasi
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.created_at)} •{" "}
                          {getElapsedTime(transaction.created_at)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Pelanggan</p>
                            <p className="font-medium">
                              {transaction.customer_name || "Guest"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Kasir</p>
                            <p className="font-medium">
                              {transaction.cashier_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-bold text-lg text-green-600">
                              {formatCurrency(transaction.total_amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Items:
                        </p>
                        <div className="space-y-1">
                          {transaction.items?.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500">
                              Tidak ada item
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:gap-3">
                      <button
                        onClick={() => confirmPayment(transaction.id)}
                        disabled={processing[transaction.id]}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors min-w-[120px]"
                      >
                        {processing[transaction.id] === "confirming" ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {processing[transaction.id] === "confirming"
                          ? "Memproses..."
                          : "Konfirmasi"}
                      </button>

                      <button
                        onClick={() => cancelPayment(transaction.id)}
                        disabled={processing[transaction.id]}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors min-w-[120px]"
                      >
                        {processing[transaction.id] === "cancelling" ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {processing[transaction.id] === "cancelling"
                          ? "Memproses..."
                          : "Batalkan"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
          <h3 className="font-medium text-blue-900 mb-2">
            Petunjuk Konfirmasi:
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>
              • Pastikan pembayaran telah masuk ke rekening sebelum
              mengkonfirmasi
            </li>
            <li>• Hubungi pelanggan jika ada ketidaksesuaian pembayaran</li>
            <li>• Batalkan transaksi jika pembayaran tidak kunjung masuk</li>
            <li>• Refresh halaman secara berkala untuk update terbaru</li>
          </ul>
        </div>
      </div>

      {/* Receipt Modal - Diperbarui tanpa tombol share */}
      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nota Transaksi</h3>
              <div className="flex gap-2">
                {/* Tombol Test Bluetooth Printer */}
                <button
                  onClick={testBluetoothPrinter}
                  disabled={printLoading}
                  className="p-2 bg-green-100 text-green-600 rounded-lg disabled:opacity-50"
                  title="Test Printer Bluetooth"
                >
                  {printLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bluetooth className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <ReceiptDisplay />

            <div className="flex gap-2 mt-4">
              <button
                onClick={handlePrint}
                disabled={printLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
              >
                {printLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer size={18} />
                )}
                {printLoading ? "Mencetak..." : "Cetak Nota"}
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>

            {/* Status Bluetooth - Sama seperti di CashierTransaction */}
            <div className="mt-3 text-center">
              <div
                className={`text-sm ${
                  bluetoothStatus === "connected"
                    ? "text-green-600"
                    : bluetoothStatus === "connecting"
                    ? "text-blue-600"
                    : bluetoothStatus === "error"
                    ? "text-red-600"
                    : bluetoothStatus === "not-supported"
                    ? "text-orange-600"
                    : "text-gray-500"
                }`}
              >
                {bluetoothStatus === "connected" &&
                  "✅ Printer Bluetooth Terhubung"}
                {bluetoothStatus === "connecting" &&
                  "🔄 Menghubungkan ke printer..."}
                {bluetoothStatus === "error" && "❌ Gagal terhubung ke printer"}
                {bluetoothStatus === "not-supported" &&
                  "⚠️ Browser tidak support Bluetooth"}
                {bluetoothStatus === "disconnected" &&
                  "📱 Printer belum terhubung"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pastikan printer RPP02N dalam jangkauan dan mode pairing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRISConfirmation;
