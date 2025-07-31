import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL;

const UserLogin = () => {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, setError] = useState("");
  const [toggle, setToggle] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToggle(true);

    try {
      const res = await fetch(`${apiUrl}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.User) {
        setError("Invalid email or Password");
      } else {
        navigate("/User");
      }

      setToggle(false);
    } catch (err) {
      console.error("Network error:", err);
      setError("Something went wrong. Please try again.");
      setToggle(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-md shadow-md space-y-4"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center text-indigo-700">
          {" "}
          Login
        </h2>

        <div>
          <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setemail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={toggle}
          className="w-full bg-indigo-600 text-black py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {toggle ? "Submitting..." : "Login"}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>Don't have an account?</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="text-indigo-600 hover:underline mt-1"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserLogin;
