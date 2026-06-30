const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Copyright */}
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              &copy; {currentYear} Kasir POS. All rights reserved.
            </p>
          </div>

          {/* Links */}
          {/*
            <div className="flex items-center space-x-6">
            <a
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Syarat Layanan
            </a>
            <a
              href="/help"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Bantuan
            </a>
          </div>
            */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
