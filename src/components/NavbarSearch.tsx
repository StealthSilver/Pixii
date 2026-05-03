"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { FaSearch } from "react-icons/fa";
import type { NavSearchItem } from "@/lib/navSearchIndex";
import { NAV_SEARCH_INDEX } from "@/lib/navSearchIndex";

const MAX_RESULTS = 8;
const MIN_QUERY_LEN = 1;

function buildFuse() {
  return new Fuse(NAV_SEARCH_INDEX, {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "section", weight: 0.15 },
      { name: "keywords", weight: 0.4 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
    shouldSort: true,
    findAllMatches: false,
  });
}

export function NavbarSearch() {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => buildFuse(), []);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results: NavSearchItem[] = useMemo(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LEN) return [];
    return fuse.search(q).slice(0, MAX_RESULTS).map((r) => r.item);
  }, [fuse, query]);

  const showList = open && query.trim().length >= MIN_QUERY_LEN;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    if (!showList) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showList]);

  const goTo = useCallback(
    (item: NavSearchItem) => {
      router.push(item.href);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [router],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showList || results.length === 0) {
        if (e.key === "Escape") {
          setOpen(false);
          setQuery("");
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) goTo(item);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    },
    [activeIndex, goTo, results, showList],
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <label htmlFor={listboxId} className="sr-only">
        Search pages and tools
      </label>
      <div className="relative flex items-center">
        <FaSearch
          className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground/75"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={listboxId}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? `${listboxId}-listbox` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 min-h-[44px] w-44 rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-base text-foreground placeholder:text-muted-foreground/75 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-primary/40 focus:ring-2 focus:ring-primary/15 sm:h-9 sm:min-h-0 sm:w-52 sm:text-sm md:w-60"
        />
      </div>

      {showList ? (
        <ul
          id={`${listboxId}-listbox`}
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-72 w-[min(100vw-2rem,20rem)] overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li
              className="px-3 py-2.5 text-sm text-muted-foreground"
              role="presentation"
            >
              No matches
            </li>
          ) : (
            results.map((item, index) => {
              const selected = index === activeIndex;
              return (
                <li key={item.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors " +
                      (selected
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground hover:bg-foreground/[0.06]")
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(item)}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.section}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
