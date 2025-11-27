import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

// Select-style dropdown props
interface SelectDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  trigger?: never;
  items?: never;
}

// Action menu dropdown props
interface MenuDropdownProps {
  trigger: ReactNode;
  items: MenuItem[];
  className?: string;
  options?: never;
  value?: never;
  onChange?: never;
  placeholder?: never;
  label?: never;
  error?: never;
  disabled?: never;
}

type DropdownProps = SelectDropdownProps | MenuDropdownProps;

const Dropdown: React.FC<DropdownProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if this is a menu-style dropdown
  const isMenuDropdown = 'trigger' in props && props.trigger !== undefined;

  const {
    className = '',
  } = props;

  // For select-style dropdown
  const options = !isMenuDropdown ? (props as SelectDropdownProps).options : [];
  const value = !isMenuDropdown ? (props as SelectDropdownProps).value : '';
  const onChange = !isMenuDropdown ? (props as SelectDropdownProps).onChange : undefined;
  const placeholder = !isMenuDropdown ? (props as SelectDropdownProps).placeholder || 'Select an option' : '';
  const label = !isMenuDropdown ? (props as SelectDropdownProps).label : undefined;
  const error = !isMenuDropdown ? (props as SelectDropdownProps).error : undefined;
  const disabled = !isMenuDropdown ? (props as SelectDropdownProps).disabled || false : false;

  // For menu-style dropdown
  const trigger = isMenuDropdown ? (props as MenuDropdownProps).trigger : null;
  const items = isMenuDropdown ? (props as MenuDropdownProps).items : [];

  const selectedOption = options?.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  // Render menu-style dropdown
  if (isMenuDropdown) {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>

        {isOpen && (
          <div className="absolute right-0 z-10 mt-1 min-w-[160px] bg-white border border-border rounded-lg shadow-lg overflow-hidden">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted text-center">
                No actions available
              </div>
            ) : (
              items.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleMenuItemClick(item)}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  {item.icon && <span className="text-text-secondary">{item.icon}</span>}
                  {item.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Render select-style dropdown
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-left bg-white border rounded-lg transition-colors ${
          error
            ? 'border-error focus:ring-error'
            : 'border-border focus:ring-primary-500'
        } focus:outline-none focus:ring-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-primary' : 'text-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-muted transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted text-center">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-primary hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Dropdown;
