import React, { useState, useEffect } from "react";
import { SearchIcon } from "@heroicons/react/solid";
import { XIcon } from "@heroicons/react/solid";
const apiUrl = import.meta.env.VITE_API_URL;

const SearchBar = ({ onContactAdded, removedEmail, onResetRemovedEmail }) => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [cross, setcross] = useState(null);

  useEffect(() => {
    if (!removedEmail) return;

    setResults((prev) =>
      prev.map((user) =>
        user.email === removedEmail ? { ...user, alreadyAdded: false } : user
      )
    );

    if (onResetRemovedEmail) {
      onResetRemovedEmail();
    }
  }, [removedEmail]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults([]);
    setcross(true);
    try {
      const res = await fetch(`${apiUrl}/api/searchUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ query: text }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.users || []);
      } else {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/UserLogin");
        }
        setError(data.message || "User not found");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (email) => {
    try {
      const res = await fetch(`${apiUrl}/api/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults((prev) =>
          prev.map((user) =>
            user.email === email ? { ...user, alreadyAdded: true } : user
          )
        );
        if (onContactAdded) {
          onContactAdded();
        }
      } else {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/UserLogin");
        }
        setError(data.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      setError("Error adding user");
    }
  };

  const handleCross = () => {
    setResults([]);
    setText("");
    setcross(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto w-full">
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 mb-4 flex-wrap sm:flex-nowrap"
      >
        <SearchIcon className="h-5 w-5 text-gray-400" />

        <input
          id="search"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter user name or email"
          className="flex-1 px-4 py-2 border border-gray-400 rounded-md min-w-[180px]"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {results.length > 0 && cross && (
        <ul className="relative space-y-4 border-2 rounded-3xl p-4 m-2">
          <button
            className="absolute top-1 right-2 p-1.5"
            onClick={() => handleCross()}
          >
            <XIcon className="h-5 w-5 text-gray-500" />
          </button>
          <br />
          {results.map((user, idx) => (
            <li
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-300 p-3 rounded-md"
            >
              <span className="text-gray-800 text-sm sm:text-base">
                👤 <strong className="font-bold">{user.name}</strong> (
                <span className="text-xs break-all">{user.email}</span>)
              </span>
              {user.alreadyAdded ? (
                <p className="text-green-600 mt-2 sm:mt-0"> Added</p>
              ) : (
                <button
                  onClick={() => handleAdd(user.email)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md mt-2 sm:mt-0 w-full sm:w-auto"
                >
                  Add
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
