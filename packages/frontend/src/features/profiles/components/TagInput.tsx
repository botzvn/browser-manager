import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { fetchAllTags } from '../../profiles/api';
import { useTranslation } from 'react-i18next';

export function TagInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const { t } = useTranslation("profiles");
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tags = value
    ? value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Fetch existing tags once on mount
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSuggestions = allTags.filter((t) => !tags.includes(t) && (inputValue === '' || t.toLowerCase().includes(inputValue.toLowerCase())));

  const addTag = (newTag: string) => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed].join(','));
    }
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      onChange(newTags.join(','));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove).join(','));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-wrap items-center gap-1.5 w-full min-h-[36px] p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow text-sm pr-16">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-medium">
            {tag}
            <Button variant="link" size="icon" type="button" onClick={() => removeTag(tag)} className="w-auto h-auto p-0 hover:text-primary/70 focus:outline-none text-current">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow click on dropdown item
            setTimeout(() => {
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }, 150);
          }}
          className="flex-1 min-w-[120px] bg-transparent outline-none border-none shadow-none placeholder:text-slate-400 py-0.5 px-1 focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none focus-visible:outline-none focus-visible:ring-0"
          placeholder={tags.length === 0 ? t('editor.general.tagsPlaceholder', 'Enter tags (press Enter to add)') : ''}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none bg-white dark:bg-slate-800 pl-2">{tags.length} tag(s)</div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border/60 max-h-48 overflow-y-auto">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before click
                addTag(tag);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
