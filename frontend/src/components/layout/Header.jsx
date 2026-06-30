import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import Swal from "sweetalert2";

const Header = ({ onToggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const navigate = useNavigate();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Update remaining time every minute
  useEffect(() => {
    const updateRemainingTime = () => {
      const remaining = authService.getRemainingTime();
      if (remaining > 0) {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor(
          (remaining % (60 * 60 * 1000)) / (60 * 1000)
        );
        setRemainingTime(`${hours}j ${minutes}m`);

        // Show warning when 30 minutes left
        if (remaining <= 30 * 60 * 1000 && remaining > 29 * 60 * 1000) {
          Swal.fire({
            title: "Sesi Akan Berakhir",
            text: "Sesi Anda akan berakhir dalam 30 menit. Silakan simpan pekerjaan Anda.",
            icon: "warning",
            confirmButtonColor: "#059669",
          });
        }
      } else {
        // Token expired
        setRemainingTime("Expired");
        handleAutoLogout();
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleAutoLogout = async () => {
    await Swal.fire({
      title: "Sesi Berakhir",
      text: "Sesi Anda telah berakhir. Silakan login kembali.",
      icon: "info",
      confirmButtonColor: "#059669",
    });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoggingOut(true);

      // Call backend logout API
      await authService.logout();

      // Show success message
      await Swal.fire({
        title: "Berhasil Logout",
        text: "Anda telah keluar dari sistem.",
        icon: "success",
        confirmButtonColor: "#059669",
        timer: 1500,
      });

      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Even if API call fails, still logout locally
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      window.dispatchEvent(new Event("authChange"));
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-gray-900">Kasir POS</h1>
              <p className="text-sm text-gray-600">Sistem Kasir Toko Modern</p>
            </div>
          </div>

          {/* Right Section - Session Time & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Session Time Indicator */}
            {/*
              {remainingTime && remainingTime !== "Expired" && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-green-700">
                  Sesi: {remainingTime}
                </span>
              </div>
            )}
              */}

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role || "Pegawai"}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email || "email@example.com"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsProfileOpen(false);
                      navigate("/profile");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Profil Saya
                  </button>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? "Logging out..." : "Keluar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
