import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import Swal from "sweetalert2";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "karyawan", // Default role sesuai database
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Nama lengkap diperlukan";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email diperlukan";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password diperlukan";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    // Role validation - hanya pemilik atau karyawan
    if (!["pemilik", "karyawan"].includes(formData.role)) {
      newErrors.role = "Role harus pemilik atau karyawan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      icon: "error",
      title: "Registrasi Gagal",
      text: message,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Coba Lagi",
      customClass: {
        popup: "rounded-xl",
        title: "text-lg font-semibold",
      },
    });
  };

  const showSuccessAlert = (message) => {
    Swal.fire({
      icon: "success",
      title: "Registrasi Berhasil!",
      html: message,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Oke",
      customClass: {
        popup: "rounded-xl",
        title: "text-lg font-semibold",
      },
    });
  };

  const showLoadingAlert = () => {
    Swal.fire({
      title: "Memproses Registrasi",
      text: "Harap tunggu sebentar...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    showLoadingAlert();

    try {
      // Pastikan data yang dikirim sesuai dengan backend
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role, // hanya 'pemilik' atau 'karyawan'
      };

      console.log("Register data:", registerData); // Debug log

      const response = await authService.register(registerData);

      // Tutup loading alert
      Swal.close();

      if (response.success) {
        const successMessage =
          response.message ||
          "Registrasi berhasil! Silakan cek email Anda untuk verifikasi sebelum login.";

        showSuccessAlert(successMessage);

        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "karyawan",
        });

        // Redirect ke login setelah sukses
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Registrasi berhasil! Silakan verifikasi email Anda.",
              registeredEmail: registerData.email,
            },
          });
        }, 2000);
      } else {
        // Handle error response dari backend
        showErrorAlert(
          response.message || "Registrasi gagal. Silakan coba lagi."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Tutup loading alert
      Swal.close();

      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";

      // Handle berbagai jenis error
      if (error.response) {
        // Error dari server dengan response
        const serverError = error.response.data;
        errorMessage =
          serverError.message ||
          serverError.error ||
          "Terjadi kesalahan server. Silakan coba lagi.";

        // Set field errors jika ada dari backend
        if (serverError.errors) {
          setErrors(serverError.errors);
        }
      } else if (error.request) {
        // Error network/tidak ada response
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      showErrorAlert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="logo.jpg"
              alt="Kasir POS Logo"
              className="w-20 h-20 object-contain rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Kasir POS
          </h1>
          <p className="mt-2 text-lg text-gray-600">Sistem Kasir Toko Modern</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex bg-white rounded-t-xl overflow-hidden shadow-sm">
          <Link
            to="/login"
            className="flex-1 py-4 text-center font-semibold text-base text-gray-500 hover:text-gray-700 bg-gray-50 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="flex-1 py-4 text-center font-semibold text-base text-gray-900 bg-white border-b-2 border-gray-900"
          >
            Register
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-b-xl">
          {/* Section Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Daftar Akun Baru
            </h2>
            <p className="mt-1 text-gray-600">
              Buat akun untuk mulai menggunakan sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nama Lengkap *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
                placeholder="Masukkan nama lengkap"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
                placeholder="contoh@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
                placeholder="Minimal 6 karakter"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Peran (Role) *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white ${
                  errors.role
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
                disabled={isLoading}
              >
                <option value="karyawan">Karyawan</option>
                <option value="pemilik">Pemilik</option>
              </select>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role}</p>
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
                  Mendaftarkan...
                </div>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-green-600 hover:text-green-500 font-medium transition-colors"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
