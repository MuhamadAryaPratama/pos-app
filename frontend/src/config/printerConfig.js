export const printerConfig = {
  rpp02n: {
    name: "RPP02N",
    serviceUUID: "000018f0-0000-1000-8000-00805f9b34fb",
    characteristicUUID: "00002af1-0000-1000-8000-00805f9b34fb",
    password: "0000", // Default password RPP02N
    paperWidth: 58, // mm
    encoding: "GBK", // Encoding untuk karakter Indonesia
    commands: {
      init: "\x1B\x40",
      cut: "\x1D\x56\x00",
      boldOn: "\x1B\x45\x01",
      boldOff: "\x1B\x45\x00",
      center: "\x1B\x61\x01",
      left: "\x1B\x61\x00",
      doubleHeight: "\x1B\x21\x10",
      normalText: "\x1B\x21\x00",
    },
  },
};
