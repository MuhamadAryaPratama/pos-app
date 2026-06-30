import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";
import Swal from "sweetalert2";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email diperlukan";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendResetEmail = async () => {
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(formData.email);

      if (response.success) {
        Swal.fire({
          title: "Email Terkirim!",
          text: "Link reset password telah dikirim ke email Anda",
          icon: "success",
          confirmButtonText: "Mengerti",
          confirmButtonColor: "#059669",
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: response.message || "Terjadi kesalahan",
          icon: "error",
          confirmButtonText: "Coba Lagi",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Terjadi kesalahan pada server",
        icon: "error",
        confirmButtonText: "Coba Lagi",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    await sendResetEmail();
    setIsSubmitted(true);
  };

  const handleResendEmail = async () => {
    await sendResetEmail();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Kasir POS
          </h1>
          <p className="mt-2 text-lg text-gray-600">Reset Password</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex bg-white rounded-t-xl overflow-hidden shadow-sm">
          <div className="flex-1 py-4 text-center font-semibold text-base text-gray-900 bg-white border-b-2 border-gray-900">
            Lupa Password
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-b-xl">
          {!isSubmitted ? (
            <>
              {/* Section Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Lupa Password
                </h2>
                <p className="mt-1 text-gray-600">
                  Masukkan email Anda untuk mendapatkan link reset password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      }`}
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-transparent rounded-lg text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Mengirim...
                    </div>
                  ) : (
                    "Kirim Link Reset Password"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Cek Email Anda
              </h3>
              <p className="text-gray-600 mb-4">
                Link reset password telah dikirim ke{" "}
                <span className="font-semibold text-gray-900">
                  {formData.email}
                </span>
              </p>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-left text-sm text-gray-700">
                    <p className="font-semibold mb-1">Langkah selanjutnya:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Buka email Anda</li>
                      <li>Klik tombol "Reset Password" di email</li>
                      <li>Anda akan diarahkan untuk membuat password baru</li>
                    </ol>
                    <p className="mt-2 text-xs text-gray-500">
                      Link akan kedaluwarsa dalam 1 jam
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Kirim Ulang Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-semibold text-gray-600 hover:text-gray-900 transition-all"
                >
                  Ubah Alamat Email
                </button>
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-semibold text-gray-600 hover:text-gray-900 transition-all"
                >
                  Kembali ke Login
                </Link>
              </div>
            </div>
          )}

          {/* Additional Links */}
          {!isSubmitted && (
            <div className="mt-6 text-center space-y-2">
              <div>
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-500 font-medium text-sm"
                >
                  Kembali ke halaman login
                </Link>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Belum punya akun?</span>{" "}
                <Link
                  to="/register"
                  className="text-green-600 hover:text-green-500 font-medium text-sm"
                >
                  Daftar di sini
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
