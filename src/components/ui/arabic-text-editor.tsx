// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArabicTextValidator, ArabicSearchEngine, arabicContentManagement } from '../../utils/arabic-content-management';

/**
 * Arabic Text Editor Props
 */
interface ArabicTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showSpellCheck?: boolean;
  showValidation?: boolean;
  showWordCount?: boolean;
  showReadabilityScore?: boolean;
  autoCorrect?: boolean;
  language?: 'ar' | 'en' | 'mixed';
  onValidationChange?: (validation: any) => void;
  className?: string;
}

/**
 * Spell Check Suggestion Component
 */
interface SpellCheckSuggestionProps {
  suggestion: {
    word: string;
    position: number;
    suggestions: string[];
    confidence: number;
  };
  onAccept: (word: string, replacement: string) => void;
  onIgnore: () => void;
  onClose: () => void;
}

const SpellCheckSuggestion: React.FC<SpellCheckSuggestionProps> = ({
  suggestion,
  onAccept,
  onIgnore,
  onClose,
}) => {
  return (
    <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-48">
      <div className="text-sm font-medium text-gray-900 mb-2">
        كلمة مشكوك فيها: <span className="text-red-600">{suggestion.word}</span>
      </div>
      
      {suggestion.suggestions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">اقتراحات:</div>
          <div className="space-y-1">
            {suggestion.suggestions.map((sug, index) => (
              <button
                key={index}
                onClick={() => onAccept(suggestion.word, sug)}
                className="block w-full text-right px-2 py-1 text-sm hover:bg-blue-50 rounded"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between gap-2">
        <button
          onClick={onIgnore}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          تجاهل
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

/**
 * Arabic Text Editor Component
 */
export const ArabicTextEditor: React.FC<ArabicTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'اكتب النص هنا...',
  disabled = false,
  readOnly = false,
  minHeight = 120,
  maxHeight = 400,
  showSpellCheck = true,
  showValidation = true,
  showWordCount = true,
  showReadabilityScore = false,
  autoCorrect = true,
  language = 'ar',
  onValidationChange,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validation, setValidation] = useState<any>(null);
  const [spellCheck, setSpellCheck] = useState<any>(null);
  const [readabilityScore, setReadabilityScore] = useState<any>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<{ x: number; y: number } | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  /**
   * Update text analysis
   */
  const updateAnalysis = useCallback((text: string) => {
    // Validation
    if (showValidation) {
      const validationResult = ArabicTextValidator.validateArabicStructure(text);
      setValidation(validationResult);
      onValidationChange?.(validationResult);
    }

    // Spell check
    if (showSpellCheck && text.trim()) {
      const spellCheckResult = ArabicTextValidator.spellCheck(text);
      setSpellCheck(spellCheckResult);
    }

    // Readability score
    if (showReadabilityScore && text.trim()) {
      const readability = arabicContentManagement.processor.calculateReadabilityScore(text);
      setReadabilityScore(readability);
    }

    // Word and character count
    if (showWordCount) {
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      setWordCount(words.length);
      setCharacterCount(text.length);
    }
  }, [showValidation, showSpellCheck, showReadabilityScore, showWordCount, onValidationChange]);

  /**
   * Handle text change
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Auto-correct common Arabic typing issues
    if (autoCorrect && language !== 'en') {
      newValue = arabicContentManagement.processor.formatArabicText(newValue, {
        normalizeSpacing: true,
        fixPunctuation: true,
      });
    }

    onChange(newValue);
    updateAnalysis(newValue);
  };

  /**
   * Handle spell check suggestion click
   */
  const handleSpellCheckClick = (e: React.MouseEvent, suggestion: any) => {
    const rect = textareaRef.current?.getBoundingClientRect();
    if (rect) {
      setSuggestionPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setActiveSuggestion(suggestion);
    }
  };

  /**
   * Accept spell check suggestion
   */
  const acceptSuggestion = (word: string, replacement: string) => {
    const newValue = value.replace(word, replacement);
    onChange(newValue);
    updateAnalysis(newValue);
    setActiveSuggestion(null);
    setSuggestionPosition(null);
  };

  /**
   * Ignore spell check suggestion
   */
  const ignoreSuggestion = () => {
    setActiveSuggestion(null);
    setSuggestionPosition(null);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Z for undo (handled by browser)
    // Ctrl+Y for redo (handled by browser)
    
    // Custom shortcuts for Arabic text
    if (e.ctrlKey) {
      switch (e.key) {
        case 'b': // Bold (not applicable for textarea, but can be extended)
          e.preventDefault();
          break;
        case 'i': // Italic
          e.preventDefault();
          break;
        case 'u': // Underline
          e.preventDefault();
          break;
      }
    }

    // Handle RTL-specific navigation
    if (language === 'ar') {
      if (e.key === 'Home') {
        // In RTL, Home should go to the right end of the line
        e.preventDefault();
        const textarea = textareaRef.current;
        if (textarea) {
          const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
          const currentLineStart = textarea.value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
          const currentLineEnd = textarea.value.indexOf('\n', textarea.selectionStart);
          const lineEnd = currentLineEnd === -1 ? textarea.value.length : currentLineEnd;
          textarea.setSelectionRange(lineEnd, lineEnd);
        }
      } else if (e.key === 'End') {
        // In RTL, End should go to the left start of the line
        e.preventDefault();
        const textarea = textareaRef.current;
        if (textarea) {
          const currentLineStart = textarea.value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
          textarea.setSelectionRange(currentLineStart, currentLineStart);
        }
      }
    }
  };

  /**
   * Initialize analysis on mount
   */
  useEffect(() => {
    updateAnalysis(value);
  }, [value, updateAnalysis]);

  /**
   * Render highlighted text with spell check
   */
  const renderHighlightedText = () => {
    if (!showSpellCheck || !spellCheck?.suggestions.length) {
      return null;
    }

    let highlightedText = value;
    const suggestions = [...spellCheck.suggestions].reverse(); // Reverse to maintain positions

    suggestions.forEach((suggestion) => {
      const word = suggestion.word;
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-red-100 border-b-2 border-red-300 cursor-pointer" data-word="${word}">${word}</span>`
      );
    });

    return (
      <div
        className="absolute inset-0 p-3 pointer-events-none whitespace-pre-wrap break-words text-transparent"
        style={{
          font: 'inherit',
          lineHeight: 'inherit',
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full p-3 border border-gray-300 rounded-lg resize-none
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${language === 'ar' ? 'text-right' : 'text-left'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${readOnly ? 'bg-gray-50' : ''}
            font-arabic text-base leading-relaxed
          `}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            direction: language === 'ar' ? 'rtl' : 'ltr',
            fontFamily: language === 'ar' ? 'Cairo, Amiri, sans-serif' : 'inherit',
          }}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          lang={language}
          spellCheck={false} // We handle spell check manually
        />

        {/* Spell check highlighting overlay */}
        {renderHighlightedText()}

        {/* Spell check suggestion popup */}
        {activeSuggestion && suggestionPosition && (
          <div
            style={{
              position: 'absolute',
              left: suggestionPosition.x,
              top: suggestionPosition.y,
            }}
          >
            <SpellCheckSuggestion
              suggestion={activeSuggestion}
              onAccept={acceptSuggestion}
              onIgnore={ignoreSuggestion}
              onClose={() => {
                setActiveSuggestion(null);
                setSuggestionPosition(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
        {/* Word and character count */}
        {showWordCount && (
          <div className="flex gap-4">
            <span>الكلمات: {wordCount}</span>
            <span>الأحرف: {characterCount}</span>
          </div>
        )}

        {/* Readability score */}
        {showReadabilityScore && readabilityScore && (
          <div className="flex items-center gap-2">
            <span>سهولة القراءة:</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                readabilityScore.level === 'easy'
                  ? 'bg-green-100 text-green-800'
                  : readabilityScore.level === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {readabilityScore.level === 'easy' ? 'سهل' : 
               readabilityScore.level === 'medium' ? 'متوسط' : 'صعب'}
              ({Math.round(readabilityScore.score)})
            </span>
          </div>
        )}

        {/* Spell check status */}
        {showSpellCheck && spellCheck && (
          <div className="flex items-center gap-2">
            {spellCheck.misspelledCount > 0 ? (
              <span className="text-red-600">
                أخطاء إملائية: {spellCheck.misspelledCount}
              </span>
            ) : (
              <span className="text-green-600">لا توجد أخطاء إملائية</span>
            )}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {showValidation && validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="mt-2 space-y-1">
          {validation.errors.map((error: string, index: number) => (
            <div key={`error-${index}`} className="text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          ))}
          {validation.warnings.map((warning: string, index: number) => (
            <div key={`warning-${index}`} className="text-sm text-yellow-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Arabic Rich Text Editor Component
 */
interface ArabicRichTextEditorProps extends Omit<ArabicTextEditorProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showToolbar?: boolean;
  allowFormatting?: boolean;
}

export const ArabicRichTextEditor: React.FC<ArabicRichTextEditorProps> = ({
  value,
  onChange,
  showToolbar = true,
  allowFormatting = true,
  ...props
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');

  /**
   * Handle text formatting
   */
  const formatText = (command: string, value?: string) => {
    if (!allowFormatting) return;
    
    document.execCommand(command, false, value);
    
    // Update the value
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  /**
   * Handle content change
   */
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  /**
   * Handle text selection
   */
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
          <button
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-gray-200 rounded"
            title="عريض"
          >
            <strong>ع</strong>
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-gray-200 rounded italic"
            title="مائل"
          >
            م
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-2 hover:bg-gray-200 rounded underline"
            title="تحته خط"
          >
            خ
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={() => formatText('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded"
            title="محاذاة يمين"
          >
            ←
          </button>
          <button
            onClick={() => formatText('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded"
            title="محاذاة وسط"
          >
            ↔
          </button>
          <button
            onClick={() => formatText('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded"
            title="محاذاة يسار"
          >
            →
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <button
            onClick={() => formatText('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="قائمة نقطية"
          >
            •
          </button>
          <button
            onClick={() => formatText('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="قائمة مرقمة"
          >
            ١
          </button>
          
          <div className="w-px bg-gray-300 mx-1" />
          
          <select
            onChange={(e) => formatText('fontSize', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            title="حجم الخط"
          >
            <option value="1">صغير</option>
            <option value="3" selected>عادي</option>
            <option value="5">كبير</option>
            <option value="7">كبير جداً</option>
          </select>
          
          <input
            type="color"
            onChange={(e) => formatText('foreColor', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="لون النص"
          />
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        className={`
          p-3 min-h-32 max-h-96 overflow-y-auto outline-none
          ${props.language === 'ar' ? 'text-right' : 'text-left'}
          font-arabic text-base leading-relaxed
        `}
        style={{
          direction: props.language === 'ar' ? 'rtl' : 'ltr',
          fontFamily: props.language === 'ar' ? 'Cairo, Amiri, sans-serif' : 'inherit',
        }}
        dir={props.language === 'ar' ? 'rtl' : 'ltr'}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

export default ArabicTextEditor; 