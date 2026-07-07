import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { Sun, Moon, LogOut } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark") || 
           localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const getInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex justify-between items-center px-6 md:px-8 transition-colors duration-250">
      <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white">
        Network Documentation Assistant
      </h2>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
            {getInitials()}
          </div>
          <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-300">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;