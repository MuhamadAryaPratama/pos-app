import { api } from "./authService";

export const transactionService = {
  // Create new transaction
  createTransaction: async (transactionData) => {
    try {
      console.log("Sending transaction data to backend:", transactionData);
      const response = await api.post("/transactions", transactionData);
      console.log("Transaction response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Transaction service error:", error);
      throw error;
    }
  },

  // Get all transactions with filters
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.payment_method)
      params.append("payment_method", filters.payment_method);
    if (filters.cashier_id) params.append("cashier_id", filters.cashier_id);
    if (filters.search) params.append("search", filters.search);
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.sort_order) params.append("sort_order", filters.sort_order);

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Get today's transactions
  getTodayTransactions: async () => {
    const response = await api.get("/transactions/today");
    return response.data;
  },

  // Delete transaction (owner only)
  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  confirmQRISPayment: async (transactionId) => {
    const response = await api.patch(
      `/transactions/${transactionId}/confirm-qris`
    );
    return response.data;
  },

  // Batalkan pembayaran QRIS
  cancelQRISPayment: async (transactionId) => {
    const response = await api.patch(
      `/transactions/${transactionId}/cancel-qris`
    );
    return response.data;
  },

  // Get pending QRIS transactions
  getPendingQRISTransactions: async () => {
    const response = await api.get("/transactions/pending-qris");
    return response.data;
  },
};
