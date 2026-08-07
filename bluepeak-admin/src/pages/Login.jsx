import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";

import { login as loginRequest } from "../services/authService";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(username, password);

      login(data);

      if (data.role === "Admin") {
    navigate("/admin");
}
else if (data.role === "Manager") {
    navigate("/manager");
}
else if (data.role === "Cashier") {
    navigate("/cashier");
}
    } catch (err) {
      console.log(err);

      setError("Invalid username or password.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-bold text-blue-700">
            BluePeak POS
          </h1>

          <p className="text-gray-500 mt-3">
            Sign in to continue
          </p>

        </div>

        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="mb-5">

            <label className="font-medium">
              Username
            </label>

            <div className="relative mt-2">

              <FaUser className="absolute left-4 top-4 text-gray-400" />

              <input
                className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

            </div>

          </div>

          <div className="mb-8">

            <label className="font-medium">
              Password
            </label>

            <div className="relative mt-2">

              <FaLock className="absolute left-4 top-4 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-xl pl-11 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 font-semibold transition"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}