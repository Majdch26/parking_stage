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
    <div ref={containerRef} className="uac-wrap">
      <Input
        className="uac-input"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen && !disabled && (
        <div className="autocomplete-dropdown uac-dropdown">
          {filtered.length === 0 ? (
            <div className="uac-empty">{emptyMessage}</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => handlePick(o)}
                className={`uac-option ${String(o.id) === String(value) ? "is-selected" : ""}`}
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