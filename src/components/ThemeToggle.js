import React from "react";
import { FaSun, FaMoon } from "react-icons/fa"; // Import FontAwesome Sun and Moon icons
import { useThemeProvider } from "../utility/ThemeContext";

export default function ThemeToggle() {
  const { currentTheme, changeCurrentTheme } = useThemeProvider();

  return (
    <div>
      <input
        type="checkbox"
        name="light-switch"
        id="light-switch"
        className="light-switch sr-only"
        checked={currentTheme === "light"}
        onChange={() => changeCurrentTheme(currentTheme === "light" ? "dark" : "light")}
      />
      <label
        className="flex items-center justify-center cursor-pointer w-8 h-8 hover:bg-gray-500 lg:hover:bg-gray-600 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full"
        htmlFor="light-switch"
      >
        <div className="border border-gray-300 dark:border-gray-600 rounded-full p-2 flex items-center justify-center">
          {currentTheme === "light" ? (
            <FaSun className="text-yellow-500" size={16} />
          ) : (
            <FaMoon className="text-gray-400" size={16} />
          )}
        </div>
        <span className="sr-only">Switch to light / dark version</span>
      </label>
    </div>
  );
}
