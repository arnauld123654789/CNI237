import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { formatMultiValueText, parseMultiValueText } from '../../lib/multiValueText';

const normalizeForSearch = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const MultiValueAutocomplete = ({
  id,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  helperText = '',
  disabled = false,
  maxSuggestions = 8
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const tokens = useMemo(() => parseMultiValueText(value), [value]);
  const selectedKeys = useMemo(() => new Set(tokens.map((token) => normalizeForSearch(token))), [tokens]);

  const filteredSuggestions = useMemo(() => {
    const queryKey = normalizeForSearch(query);
    return suggestions
      .filter((item) => {
        const itemKey = normalizeForSearch(item);
        if (!itemKey || selectedKeys.has(itemKey)) return false;
        if (!queryKey) return true;
        return itemKey.includes(queryKey);
      })
      .slice(0, maxSuggestions);
  }, [suggestions, selectedKeys, query, maxSuggestions]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const commitTokens = (nextTokens) => {
    onChange(formatMultiValueText(nextTokens));
  };

  const addToken = (candidate) => {
    if (disabled) return;
    const nextToken = candidate?.toString().trim();
    if (!nextToken) return;

    const nextKey = normalizeForSearch(nextToken);
    if (!nextKey || selectedKeys.has(nextKey)) {
      setQuery('');
      return;
    }

    commitTokens([...tokens, nextToken]);
    setQuery('');
    setIsOpen(true);
  };

  const removeToken = (tokenToRemove) => {
    if (disabled) return;
    commitTokens(tokens.filter((token) => token !== tokenToRemove));
  };

  const handleInputKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ',') {
      if (query.trim()) {
        event.preventDefault();
        addToken(query);
      }
      return;
    }

    if (event.key === 'Backspace' && !query && tokens.length > 0) {
      removeToken(tokens[tokens.length - 1]);
    }
  };

  const showSuggestions = !disabled && isOpen && filteredSuggestions.length > 0;
  const showNoResultHint = !disabled && isOpen && query.trim() && filteredSuggestions.length === 0;

  return (
    <div className="w-full space-y-2" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className={cn(
          'w-full rounded-lg border border-gray-300 px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500',
          disabled && 'bg-slate-100 cursor-not-allowed'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tokens.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {tokens.map((token) => (
              <span
                key={token}
                className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800"
              >
                {token}
                {!disabled && (
                  <button
                    type="button"
                    className="rounded-full px-1 text-sky-700 hover:bg-sky-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeToken(token);
                    }}
                    aria-label={`Retirer ${token}`}
                  >
                    x
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <input
          id={id}
          ref={inputRef}
          value={query}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            if (query.trim()) {
              addToken(query);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          className={cn('w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0', disabled && 'cursor-not-allowed')}
          placeholder={placeholder}
        />
      </div>

      {showSuggestions && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filteredSuggestions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addToken(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showNoResultHint && (
        <p className="text-xs text-slate-500">Aucune suggestion. Appuyez sur Entree pour ajouter votre texte.</p>
      )}

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
