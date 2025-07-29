"use client";

import React, { useState, useRef, useEffect } from "react";

type SearchableDropdownProps = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
};

export default function SearchableDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  label,
  className = "",
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onChange(filteredOptions[focusedIndex]);
          setIsOpen(false);
          setSearchTerm("");
          setFocusedIndex(-1);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs muted font-medium mb-1">{label}</label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? "Search..." : value || placeholder}
          className={`
            w-full pr-8 cursor-pointer
            ${isOpen ? "cursor-text" : "cursor-pointer"}
          `}
          readOnly={!isOpen}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`transition-transform text-muted ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 9.5 5.354 6.146a.5.5 0 0 1 0-.708z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                onClick={() => handleOptionClick(option)}
                className={`
                  px-3 py-2 cursor-pointer text-sm transition-colors
                  hover:bg-[var(--surface-3)]
                  ${index === focusedIndex ? "bg-[var(--surface-3)]" : ""}
                  ${
                    option === value
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : ""
                  }
                `}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted">No symbols found</div>
          )}
        </div>
      )}
    </div>
  );
}
