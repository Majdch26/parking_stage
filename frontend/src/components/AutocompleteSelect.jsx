import { useEffect, useRef, useState } from "react";
import { Input } from "reactstrap";

/**
 * Type-to-filter autocomplete. Built for lists too long for a native <select> to be usable
 * (hundreds/thousands of brands or models) -- type a few letters, see matches, click one.
 *
 * options: [{ id, label }]
 * value: the currently selected id (or "")
 * onChange(id): called with the picked option's id, or "" if the field is cleared
 */
export default function AutocompleteSelect({
  options,
  value,
  onChange,
  placeholder = "Tape pour chercher...",
  disabled = false,
  emptyMessage = "Aucun résultat.",
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  useEffect(() => {
    setQuery(selectedOption ? selectedOption.label : "");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery(selectedOption ? selectedOption.label : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const filtered =
    query.trim() === "" || query === selectedOption?.label
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  const handlePick = (option) => {
    setQuery(option.label);
    setIsOpen(false);
    onChange(String(option.id));
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
    if (e.target.value === "") {
      onChange("");
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
      />

      {isOpen && !disabled && (
        <div
          className="autocomplete-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "white",
            border: "1px solid #e3e7f0",
            borderRadius: "14px",
            boxShadow: "0 16px 36px rgba(16,23,42,0.14)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 14px", color: "#8a94a6", fontSize: "0.85rem" }}>{emptyMessage}</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => handlePick(o)}
                style={{
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#10172a",
                  background: String(o.id) === String(value) ? "#eaf1ff" : "white",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = String(o.id) === String(value) ? "#eaf1ff" : "white")
                }
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}