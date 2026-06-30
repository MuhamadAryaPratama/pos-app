import { printerConfig } from "../config/printerConfig";
class BluetoothPrintService {
  constructor() {
    this.config = printerConfig.rpp02n;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    this.printerPassword = "0000"; // Default password, bisa disesuaikan
  }

  // Cari dan koneksi ke printer Bluetooth
  async connectToPrinter() {
    try {
      console.log("Mencari printer RPP02N...");

      const options = {
        filters: [{ name: this.config.name }],
        optionalServices: [
          this.config.serviceUUID,
          "00001800-0000-1000-8000-00805f9b34fb",
          "00001801-0000-1000-8000-00805f9b34fb",
        ],
      };

      // Request device Bluetooth
      this.device = await navigator.bluetooth.requestDevice(options);

      console.log("Device found:", this.device.name);

      // Add event listener for disconnection
      this.device.addEventListener(
        "gattserverdisconnected",
        this.onDisconnected.bind(this)
      );

      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      console.log("Connected to GATT server");

      // Get primary service (umumnya menggunakan service yang tersedia)
      const services = await this.server.getPrimaryServices();
      console.log("Available services:", services);

      // Coba berbagai service UUID yang umum untuk printer
      const serviceUUIDs = [
        "000018f0-0000-1000-8000-00805f9b34fb", // Service umum printer
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Service alternatif
        "0000ae00-0000-1000-8000-00805f9b34fb", // Service lain
      ];

      for (const uuid of serviceUUIDs) {
        try {
          this.service = await this.server.getPrimaryService(
            this.config.serviceUUID
          );
          console.log(`Found service: ${uuid}`);
          break;
        } catch (error) {
          console.log(`Service ${uuid} not found, trying next...`);
        }
      }

      if (!this.service) {
        throw new Error("Tidak dapat menemukan service printer yang sesuai");
      }

      // Get characteristics
      const characteristics = await this.service.getCharacteristics();
      console.log("Available characteristics:", characteristics);

      // Cari characteristic untuk write (umumnya UUID ini)
      const writeCharacteristic = characteristics.find(
        (char) => char.properties.write || char.properties.writeWithoutResponse
      );

      if (!writeCharacteristic) {
        throw new Error(
          "Tidak dapat menemukan characteristic untuk menulis data"
        );
      }

      this.characteristic = writeCharacteristic;
      this.isConnected = true;

      console.log("Berhasil terhubung ke printer");
      return true;
    } catch (error) {
      console.error("Error connecting to printer:", error);
      this.isConnected = false;
      throw error;
    }
  }

  onDisconnected() {
    console.log("Printer disconnected");
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
  }

  // Putuskan koneksi
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
  }

  // Kirim perintah ke printer
  async writeData(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error("Printer tidak terhubung");
    }

    try {
      // Convert data to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Write data to characteristic
      await this.characteristic.writeValue(dataBuffer);
      console.log("Data berhasil dikirim ke printer");
    } catch (error) {
      console.error("Error writing data to printer:", error);
      throw error;
    }
  }

  // Set password printer (jika diperlukan)
  async setPassword() {
    const passwordCommand = `\x1B\x27\x70\x01\x00${this.printerPassword}\r\n`;
    await this.writeData(passwordCommand);
  }

  // Perintah ESC/POS untuk inisialisasi printer
  async initializePrinter() {
    const initCommands = [
      "\x1B\x40", // Initialize printer
      "\x1B\x33\x00", // Set line spacing to 0
    ].join("");

    await this.writeData(initCommands);
  }

  // Format teks untuk receipt
  async printReceipt(transactionData) {
    if (!this.isConnected) {
      await this.connectToPrinter();
    }

    try {
      // Set password jika diperlukan
      await this.setPassword();

      // Initialize printer
      await this.initializePrinter();

      // Header receipt
      let receiptData = "";

      // Center align dan text besar untuk header
      receiptData += "\x1B\x61\x01"; // Center align
      receiptData += "\x1B\x21\x30"; // Double height and width
      receiptData += "NOTA TRANSAKSI\n";
      receiptData += "\x1B\x21\x00"; // Normal text
      receiptData += "TOKO ANDA\n";
      receiptData += "================\n";
      receiptData += "\x1B\x61\x00"; // Left align

      // Informasi transaksi
      receiptData += `No Invoice: ${transactionData.invoice_number}\n`;
      receiptData += `Tanggal: ${new Date(
        transactionData.created_at
      ).toLocaleString("id-ID")}\n`;
      receiptData += `Kasir: ${transactionData.cashier_name}\n`;
      receiptData += `Pelanggan: ${transactionData.customer_name}\n`;
      receiptData += "----------------\n";

      // Header tabel items
      receiptData += "\x1B\x21\x08"; // Emphasized
      receiptData += "Item            Qty  Subtotal\n";
      receiptData += "\x1B\x21\x00"; // Normal
      receiptData += "----------------\n";

      // Items
      transactionData.items.forEach((item) => {
        const name =
          item.product_name.length > 16
            ? item.product_name.substring(0, 16) + ".."
            : item.product_name.padEnd(18);

        const qty = item.quantity.toString().padStart(2);
        const subtotal = this.formatCurrency(item.subtotal).padStart(10);

        receiptData += `${name} ${qty} ${subtotal}\n`;

        // Harga satuan
        const price = `  @${this.formatCurrency(item.price)}`;
        receiptData += `${price}\n`;
      });

      receiptData += "----------------\n";

      // Total breakdown
      receiptData += `Subtotal:${this.formatCurrency(
        transactionData.subtotal_amount
      ).padStart(13)}\n`;
      receiptData += `PPN 10%:${this.formatCurrency(
        transactionData.tax_amount
      ).padStart(13)}\n`;

      receiptData += "\x1B\x21\x10"; // Double height
      receiptData += `TOTAL:${this.formatCurrency(
        transactionData.total_amount
      ).padStart(15)}\n`;
      receiptData += "\x1B\x21\x00"; // Normal

      receiptData += "----------------\n";
      receiptData += `Metode: ${transactionData.payment_method.toUpperCase()}\n`;
      receiptData += `Bayar:${this.formatCurrency(
        transactionData.paid_amount
      ).padStart(15)}\n`;

      if (transactionData.payment_method === "cash") {
        receiptData += `Kembali:${this.formatCurrency(
          transactionData.change_amount
        ).padStart(13)}\n`;
      }

      receiptData += "================\n";
      receiptData += "\x1B\x61\x01"; // Center align
      receiptData += "Terima kasih\n";
      receiptData += "atas kunjungan Anda!\n";

      // Cut paper (jika printer mendukung)
      receiptData += "\x1D\x56\x00"; // Partial cut

      // Feed beberapa line sebelum cut
      receiptData += "\n\n\n\n\n";

      // Kirim data ke printer
      await this.writeData(receiptData);

      console.log("Receipt berhasil dikirim ke printer");
    } catch (error) {
      console.error("Error printing receipt:", error);
      throw error;
    }
  }

  // Format currency untuk receipt
  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace("Rp", "Rp ");
  }

  // Test printer connection
  async testPrint() {
    try {
      if (!this.isConnected) {
        await this.connectToPrinter();
      }

      await this.initializePrinter();

      const testData =
        "\x1B\x61\x01" + // Center align
        "\x1B\x21\x30" + // Double height and width
        "TEST PRINT\n" +
        "\x1B\x21\x00" + // Normal text
        "Printer Bluetooth\n" +
        "Connection Test\n" +
        "\n\n\n" +
        "\x1D\x56\x00"; // Partial cut

      await this.writeData(testData);
      console.log("Test print berhasil");
    } catch (error) {
      console.error("Test print gagal:", error);
      throw error;
    }
  }
}

export const bluetoothPrintService = new BluetoothPrintService();
