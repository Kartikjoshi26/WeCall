import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL;

const Lobby = () => {
  const [name, setUserName] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [toggle, setToggle] = useState(false);
  const [error, seterror] = useState(null);

  const navigate = useNavigate();

  const isPasswordValid = (password) => {
    const regex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToggle(true);

    if (!isPasswordValid(password)) {
      seterror(
        "Password must be at least 6 characters and include one special character."
      );
      setToggle(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        navigate("/UserLogin");
      } else {
        seterror(data.message);
      }

      setToggle(false);
    } catch (error) {
      seterror("Something went wrong");
    }
  };

  const handleOnClick = (e) => {
    e.preventDefault();
    navigate("/UserLogin");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm md:max-w-md lg:max-w-lg bg-white p-6 md:p-8 rounded-xl shadow-lg space-y-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center text-indigo-700">
          Sign Up
        </h2>

        <div>
          <label
            htmlFor="name"
            className="block mb-1 font-semibold text-gray-700"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            value={name}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block mb-1 font-semibold text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            value={email}
            onChange={(e) => setemail(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block mb-1 font-semibold text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            At least 6 characters, 1 special character required.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={toggle}
          className="w-full bg-indigo-600 text-black font-semibold py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {toggle ? "Submitting..." : "Sign Up"}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">Already have an account?</p>
          <button
            onClick={handleOnClick}
            className="text-indigo-600 font-medium hover:underline mt-1"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Lobby;
