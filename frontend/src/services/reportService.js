import { api } from "./authService";

const reportService = {
  getStockReport: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/stock?${params.toString()}`);
  },

  downloadStockCSV: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/stock/download/csv?${params.toString()}`, {
      responseType: "blob",
    });
  },

  downloadStockPDF: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/stock/download/pdf?${params.toString()}`, {
      responseType: "blob",
    });
  },

  getStockStatistics: () => {
    return api.get("/reports/stock/statistics");
  },

  getStockAlerts: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/stock/alerts?${params.toString()}`);
  },

  getTransactionReport: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/transactions?${params.toString()}`);
  },

  downloadTransactionCSV: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/transactions/download/csv?${params.toString()}`, {
      responseType: "blob",
    });
  },

  downloadTransactionPDF: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/reports/transactions/download/pdf?${params.toString()}`, {
      responseType: "blob",
    });
  },

  // TAMBAHKAN FUNGSI INI - Download PDF untuk detail transaksi individual
  downloadTransactionDetailPDF: (transactionId) => {
    return api.get(`/reports/transactions/${transactionId}/download/pdf`, {
      responseType: "blob",
    });
  },

  getTransactionStatistics: () => {
    return api.get("/reports/transactions/statistics");
  },
};

export default reportService;
