
import { useState, useEffect, useCallback, useRef } from 'react';

interface SearchMatch {
  elementRef: HTMLElement;
  text: string;
  index: number;
}

interface UseSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  matches: SearchMatch[];
  nextMatch: () => void;
  previousMatch: () => void;
  highlightCurrentMatch: () => void;
}

export function useSearch(): UseSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  const findMatches = useCallback(() => {
    if (!searchQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    // Find all text nodes in the table
    const tableElement = document.querySelector('.data-table-container');
    if (!tableElement) return;

    const matches: SearchMatch[] = [];
    const walk = document.createTreeWalker(
      tableElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null = walk.nextNode();
    while (node) {
      const text = node.textContent || '';
      const indices: number[] = [];
      let index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
      
      while (index !== -1) {
        indices.push(index);
        index = text.toLowerCase().indexOf(searchQuery.toLowerCase(), index + 1);
      }

      if (indices.length > 0) {
        const parentElement = node.parentElement;
        if (parentElement) {
          matches.push({
            elementRef: parentElement,
            text,
            index: indices[0]
          });
        }
      }
      node = walk.nextNode();
    }

    setMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  }, [searchQuery]);

  useEffect(() => {
    findMatches();
  }, [searchQuery, findMatches]);

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const previousMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const highlightCurrentMatch = useCallback(() => {
    if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
      const match = matches[currentMatchIndex];
      match.elementRef.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [matches, currentMatchIndex]);

  useEffect(() => {
    highlightCurrentMatch();
  }, [currentMatchIndex, highlightCurrentMatch]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('#table-search') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // Enter/F3 for next match
      else if (e.key === 'Enter' || e.key === 'F3') {
        e.preventDefault();
        nextMatch();
      }
      // Shift + Enter/F3 for previous match
      else if (e.key === 'Enter' && e.shiftKey || (e.key === 'F3' && e.shiftKey)) {
        e.preventDefault();
        previousMatch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextMatch, previousMatch]);

  return {
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    totalMatches: matches.length,
    matches,
    nextMatch,
    previousMatch,
    highlightCurrentMatch
  };
}
