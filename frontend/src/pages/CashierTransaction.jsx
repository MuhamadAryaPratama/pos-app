import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  Receipt,
  Printer,
  X,
  AlertCircle,
  Package,
  Download,
  QrCode,
  Clock,
  RefreshCw,
  Bluetooth,
} from "lucide-react";
import { productService } from "../services/productService";
import { categoriesService } from "../services/categoriesService";
import { transactionService } from "../services/transactionService";
import { bluetoothPrintService } from "../services/bluetoothPrintService";
import { useNavigate } from "react-router-dom";

// Cart Component - Moved outside to prevent re-creation
const CartSection = ({
  cart,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  loading,
  clearCart,
  removeFromCart,
  updateQuantity,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateChange,
  handleSubmitTransaction,
  formatCurrency,
  formatCurrencyInput,
  parseCurrency,
}) => (
  <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 h-fit lg:sticky lg:top-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
        <ShoppingCart size={24} />
        Keranjang
        {cart.length > 0 && (
          <span className="bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded-full">
            {cart.length}
          </span>
        )}
      </h2>
      {cart.length > 0 && (
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Kosongkan</span>
        </button>
      )}
    </div>

    <div className="space-y-3 mb-4 max-h-[40vh] lg:max-h-[300px] overflow-y-auto">
      {cart.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Keranjang kosong</p>
      ) : (
        cart.map((item) => (
          <div key={item.product_id} className="border-b pb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm lg:text-base">
                  {item.product_name}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.price)}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.product_id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product_id, -1)}
                  className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product_id, 1)}
                  className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="font-bold text-blue-600 text-sm lg:text-base">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>

    {cart.length > 0 && (
      <div className="border-t pt-4 mb-4">
        {/* Breakdown Harga dengan PPN */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>PPN (10%):</span>
            <span>{formatCurrency(calculateTax())}</span>
          </div>
          <div className="flex justify-between text-lg lg:text-xl font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold mb-2">
            Nama Pelanggan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Masukkan nama pelanggan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold mb-2">
            Metode Pembayaran
          </label>
          <div className="flex gap-2">
            <button
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                paymentMethod === "cash"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              Cash
            </button>
            <button
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                paymentMethod === "qris"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setPaymentMethod("qris")}
            >
              QRIS
            </button>
          </div>
        </div>

        {paymentMethod === "cash" && (
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-2">
              Jumlah Bayar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                Rp
              </span>
              <input
                type="text"
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                value={formatCurrencyInput(paidAmount)}
                onChange={(e) => {
                  const value = parseCurrency(e.target.value);
                  setPaidAmount(value);
                }}
                onFocus={(e) => {
                  if (parseCurrency(e.target.value) === 0) {
                    e.target.value = "";
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setPaidAmount(0);
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimal bayar: {formatCurrency(calculateTotal())}
            </p>
          </div>
        )}

        {paymentMethod === "cash" && paidAmount > 0 && (
          <div className="flex justify-between text-base lg:text-lg font-bold mb-4">
            <span>Kembalian:</span>
            <span
              className={
                calculateChange() >= 0 ? "text-green-600" : "text-red-600"
              }
            >
              {formatCurrency(calculateChange())}
            </span>
          </div>
        )}

        <button
          onClick={handleSubmitTransaction}
          disabled={
            loading ||
            cart.length === 0 ||
            (paymentMethod === "cash" && calculateChange() < 0)
          }
          className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-base lg:text-lg ${
            paymentMethod === "qris"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {paymentMethod === "qris" ? (
            <>
              <QrCode size={20} />
              {loading ? "Memproses..." : "Bayar dengan QRIS"}
            </>
          ) : (
            <>
              <Receipt size={20} />
              {loading ? "Memproses..." : "Bayar & Cetak"}
            </>
          )}
        </button>

        {paymentMethod === "qris" && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-semibold">Pembayaran QRIS</p>
                <p>
                  Transaksi akan menunggu konfirmasi pembayaran terlebih dahulu
                  sebelum mencetak nota.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

const CashierTransaction = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState("disconnected");
  const receiptRef = useRef();

  // Detect screen size and PWA installation
  useEffect(() => {
    const checkScreenSize = () => {
      setMobileView(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check Bluetooth support
    checkBluetoothSupport();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fungsi untuk cek Bluetooth support
  const checkBluetoothSupport = () => {
    const supportInfo = {
      bluetoothSupported: !!navigator.bluetooth,
      browser: navigator.userAgent,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isLocalhost:
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    console.log("Bluetooth Support Info:", supportInfo);

    if (!navigator.bluetooth) {
      console.warn("Web Bluetooth tidak didukung di browser ini");
      setBluetoothStatus("not-supported");
    }
  };

  // Fungsi untuk format currency display
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Fungsi untuk format currency di input field
  const formatCurrencyInput = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount === 0) return "";

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Fungsi untuk parse currency dari input field
  const parseCurrency = (value) => {
    const digitsOnly = value.replace(/\D/g, "");
    const numberValue = parseInt(digitsOnly) || 0;
    return numberValue;
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setError("");

      const response = await productService.getProducts({
        is_available: true,
        limit: 100,
      });

      console.log("Products response:", response);

      let productsData = [];

      if (response.success && response.data) {
        if (response.data.products && Array.isArray(response.data.products)) {
          productsData = response.data.products;
        } else if (Array.isArray(response.data)) {
          productsData = response.data;
        }
      } else if (Array.isArray(response)) {
        productsData = response;
      } else if (response.products && Array.isArray(response.products)) {
        productsData = response.products;
      }

      console.log("Processed products:", productsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Terjadi kesalahan saat memuat produk");

      // Fallback untuk development
      const mockProducts = [
        {
          id: 1,
          name: "Kopi Hitam",
          price: 15000,
          stock_quantity: 50,
          category_name: "Minuman",
          image_url: null,
          is_available: true,
        },
        {
          id: 2,
          name: "Roti Bakar",
          price: 12000,
          stock_quantity: 30,
          category_name: "Makanan",
          image_url: null,
          is_available: true,
        },
        {
          id: 3,
          name: "Teh Manis",
          price: 8000,
          stock_quantity: 40,
          category_name: "Minuman",
          image_url: null,
          is_available: true,
        },
      ];
      setProducts(mockProducts);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesService.getAllCategories();
      console.log("Categories response:", response);

      let categoriesData = [];

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        }
      } else if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response.categories && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      }

      console.log("Processed categories:", categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Fallback categories untuk development
      const fallbackCategories = [
        { id: 1, name: "Minuman" },
        { id: 2, name: "Makanan" },
        { id: 3, name: "Snack" },
      ];
      setCategories(fallbackCategories);
    }
  };

  const installPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  // Fungsi untuk print ke Bluetooth
  const handleBluetoothPrint = async (transaction) => {
    try {
      setPrintLoading(true);
      setBluetoothStatus("connecting");

      // Cek apakah browser mendukung Web Bluetooth
      if (!navigator.bluetooth) {
        throw new Error(
          "Browser tidak mendukung Web Bluetooth API. Gunakan Chrome atau Edge versi terbaru."
        );
      }

      console.log("Memulai print ke printer Bluetooth...");

      // Print receipt
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
    if (!lastTransaction) return;

    // Coba print ke Bluetooth terlebih dahulu
    try {
      await handleBluetoothPrint(lastTransaction);
      alert("✅ Nota berhasil dikirim ke printer Bluetooth!");
    } catch (error) {
      console.log("Fallback ke print browser:", error);

      // Fallback ke print browser biasa
      const receiptContent = receiptRef.current;
      const printWindow = window.open("", "_blank");

      printWindow.document.write(`
        <html>
          <head>
            <title>Nota Transaksi - ${lastTransaction.invoice_number}</title>
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const categoryName =
      product.category_name ||
      (product.category && product.category.name) ||
      "Tidak Berkategori";

    const matchesCategory =
      activeCategory === "all" || categoryName === activeCategory;

    return matchesSearch && matchesCategory && product.is_available;
  });

  const addToCart = (product) => {
    const availableStock =
      product.stock_quantity !== undefined ? product.stock_quantity : 999;

    if (availableStock <= 0) {
      alert("Stok produk habis!");
      return;
    }

    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > availableStock) {
        alert(`Stok tidak mencukupi! Stok tersedia: ${availableStock}`);
        return;
      }

      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: parseFloat(item.price) * (item.quantity + 1),
              }
            : item
        )
      );
    } else {
      const productPrice = parseFloat(product.price);

      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          price: productPrice,
          quantity: 1,
          subtotal: productPrice,
        },
      ]);
    }

    if (mobileView) {
      setShowCart(true);
    }
  };

  const updateQuantity = (productId, change) => {
    const product = products.find((p) => p.id === productId);
    const cartItem = cart.find((item) => item.product_id === productId);

    if (!product || !cartItem) return;

    const availableStock =
      product.stock_quantity !== undefined ? product.stock_quantity : 999;
    const newQuantity = cartItem.quantity + change;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > availableStock) {
      alert(`Stok tidak mencukupi! Stok tersedia: ${availableStock}`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: parseFloat(item.price) * newQuantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateSubtotal = () => {
    if (cart.length === 0) return 0;
    return cart.reduce(
      (sum, item) => sum + (parseFloat(item.subtotal) || 0),
      0
    );
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1; // PPN 10%
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax;
  };

  const calculateChange = () => {
    const paid = parseFloat(paidAmount) || 0;
    const total = calculateTotal();
    return paid - total;
  };

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;

    // Validasi khusus untuk cash
    if (paymentMethod === "cash" && paid < total) {
      alert("Jumlah pembayaran kurang!");
      return;
    }

    // Untuk QRIS, paid_amount harus sama dengan total
    const finalPaidAmount = paymentMethod === "qris" ? total : paid;

    setLoading(true);
    setError("");

    try {
      const transactionData = {
        customer_name: customerName || "Guest",
        payment_method: paymentMethod,
        paid_amount: finalPaidAmount,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      console.log("Sending transaction data to backend:", transactionData);

      const response = await transactionService.createTransaction(
        transactionData
      );

      if (response.success) {
        if (paymentMethod === "qris") {
          // Untuk QRIS, redirect ke halaman konfirmasi
          navigate("/qris-confirmation", {
            state: {
              transaction: response.data.transaction,
              message: response.message,
            },
          });
        } else {
          // Untuk cash, langsung tampilkan receipt
          setLastTransaction(response.data.transaction);
          setShowReceipt(true);

          // Reset form setelah transaksi berhasil
          setCart([]);
          setPaidAmount(0);
          setCustomerName("");
          setShowCart(false);

          // Refresh produk untuk update stok
          await fetchProducts();
        }
      } else {
        throw new Error(response.message || "Gagal membuat transaksi");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      setError("Terjadi kesalahan saat membuat transaksi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    if (mobileView) {
      setShowCart(false);
    }
  };

  const MobileHeader = () => (
    <div className="bg-white shadow-sm border-b print:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCart(false)}
            className={`p-2 rounded-lg ${
              !showCart ? "bg-blue-100 text-blue-600" : "bg-gray-100"
            }`}
          >
            <Package size={20} />
          </button>
          <button
            onClick={() => setShowCart(true)}
            className={`p-2 rounded-lg relative ${
              showCart ? "bg-blue-100 text-blue-600" : "bg-gray-100"
            }`}
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        <h1 className="text-lg font-bold text-gray-800">Cashier</h1>

        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              onClick={installPWA}
              className="p-2 bg-green-100 text-green-600 rounded-lg"
              title="Install App"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>

      {!showCart && cart.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">{cart.length} items</span>
              <span className="text-blue-600 font-bold ml-2">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Lihat Keranjang
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const ProductsGrid = () => (
    <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Produk</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex-1 sm:flex-none"
          >
            Refresh
          </button>
          {mobileView && installPrompt && (
            <button
              onClick={installPWA}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
            >
              <Download size={16} />
              Install
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cari produk..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeCategory === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeCategory === category.name
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {category.name.length > 12
                  ? `${category.name.substring(0, 12)}...`
                  : category.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {productsLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 max-h-[60vh] lg:max-h-[500px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchTerm
                ? "Produk tidak ditemukan"
                : "Tidak ada produk tersedia"}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`border rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer flex flex-col ${
                  (product.stock_quantity !== undefined &&
                    product.stock_quantity <= 0) ||
                  !product.is_available
                    ? "border-red-300 bg-red-50 opacity-60"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => {
                  if (
                    (product.stock_quantity === undefined ||
                      product.stock_quantity > 0) &&
                    product.is_available
                  ) {
                    addToCart(product);
                  }
                }}
              >
                <div className="w-full h-20 lg:h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="text-gray-400" size={24} />
                  )}
                </div>
                <h3 className="font-semibold text-xs lg:text-sm mb-1 line-clamp-2 flex-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1 truncate">
                  {product.category_name ||
                    (product.category && product.category.name) ||
                    "Tidak Berkategori"}
                </p>
                <p className="text-blue-600 font-bold text-xs lg:text-sm">
                  {formatCurrency(product.price)}
                </p>
                {product.stock_quantity !== undefined && (
                  <p
                    className={`text-xs ${
                      product.stock_quantity <= 0
                        ? "text-red-600 font-semibold"
                        : product.stock_quantity <= 10
                        ? "text-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    Stok: {product.stock_quantity}
                    {product.stock_quantity <= 0 && " (Habis)"}
                  </p>
                )}
                {!product.is_available && (
                  <p className="text-xs text-red-600 font-semibold">
                    Tidak Tersedia
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const ReceiptDisplay = () => {
    if (!lastTransaction) return null;

    return (
      <div ref={receiptRef} className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold mb-2">NOTA TRANSAKSI</h2>
        <p className="text-sm text-gray-600 mb-4">Toko Anda</p>

        <div className="border-t border-b border-dashed py-3 mb-3 text-left text-sm">
          <div className="flex justify-between mb-1">
            <span>No Invoice:</span>
            <span className="font-semibold">
              {lastTransaction.invoice_number}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Tanggal:</span>
            <span>
              {new Date(lastTransaction.created_at).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Kasir:</span>
            <span>{lastTransaction.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span>{lastTransaction.customer_name}</span>
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
              {lastTransaction.items.map((item, idx) => (
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
            <span>{formatCurrency(lastTransaction.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between mb-1 text-orange-600">
            <span>PPN (10%):</span>
            <span>{formatCurrency(lastTransaction.tax_amount)}</span>
          </div>
          <div className="flex justify-between mb-2 font-bold border-t pt-2">
            <span>TOTAL:</span>
            <span className="text-lg">
              {formatCurrency(lastTransaction.total_amount)}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Metode:</span>
            <span className="uppercase">{lastTransaction.payment_method}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Bayar:</span>
            <span>{formatCurrency(lastTransaction.paid_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembalian:</span>
            <span className="text-green-600 font-semibold">
              {formatCurrency(lastTransaction.change_amount)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Terima kasih atas kunjungan Anda!
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {mobileView && <MobileHeader />}

      <div
        className={`max-w-7xl mx-auto print:max-w-none ${
          mobileView ? "p-2" : "p-4"
        }`}
      >
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 print:hidden">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {mobileView ? (
          <div className="relative">
            {!showCart ? (
              <ProductsGrid />
            ) : (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                  <button
                    onClick={() => setShowCart(false)}
                    className="flex items-center gap-2 text-blue-600 font-semibold"
                  >
                    <X size={20} />
                    Kembali ke Produk
                  </button>
                </div>
                <div className="p-4">
                  <CartSection
                    cart={cart}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    paidAmount={paidAmount}
                    setPaidAmount={setPaidAmount}
                    loading={loading}
                    clearCart={clearCart}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                    calculateSubtotal={calculateSubtotal}
                    calculateTax={calculateTax}
                    calculateTotal={calculateTotal}
                    calculateChange={calculateChange}
                    handleSubmitTransaction={handleSubmitTransaction}
                    formatCurrency={formatCurrency}
                    formatCurrencyInput={formatCurrencyInput}
                    parseCurrency={parseCurrency}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <ProductsGrid />
            </div>
            <div>
              <CartSection
                cart={cart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                loading={loading}
                clearCart={clearCart}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                calculateSubtotal={calculateSubtotal}
                calculateTax={calculateTax}
                calculateTotal={calculateTotal}
                calculateChange={calculateChange}
                handleSubmitTransaction={handleSubmitTransaction}
                formatCurrency={formatCurrency}
                formatCurrencyInput={formatCurrencyInput}
                parseCurrency={parseCurrency}
              />
            </div>
          </div>
        )}
      </div>

      {showReceipt && lastTransaction && (
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

            {/* Status Bluetooth */}
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

export default CashierTransaction;
