import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Underline } from 'lucide-react';

const ALLOWED_TAGS = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'EM', 'H3', 'H4', 'I', 'LI', 'OL', 'P', 'STRONG', 'U', 'UL']);

export function sanitizeRichText(value: string): string {
  if (!value) return '';
  const documentParser = new DOMParser();
  const parsed = documentParser.parseFromString(value, 'text/html');
  parsed.body.querySelectorAll('script, style, iframe, object, embed, form').forEach(element => element.remove());

  parsed.body.querySelectorAll('*').forEach(element => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }
    Array.from(element.attributes).forEach(attribute => {
      if (element.tagName === 'A' && attribute.name === 'href' && /^(https?:|mailto:)/i.test(attribute.value)) return;
      element.removeAttribute(attribute.name);
    });
    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return parsed.body.innerHTML;
}

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = '', onChange, placeholder = 'Write a product description...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== sanitizeRichText(value)) {
      editorRef.current.innerHTML = sanitizeRichText(value);
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) onChange(sanitizeRichText(editorRef.current.innerHTML));
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt('Enter a link URL');
    if (url?.trim()) runCommand('createLink', url.trim());
  };

  const toolbarButton = (label: string, onMouseDown: () => void, icon: React.ReactNode) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={event => { event.preventDefault(); onMouseDown(); }}
      className="rounded-md p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
    >
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 p-1.5">
        {toolbarButton('Bold', () => runCommand('bold'), <Bold className="h-4 w-4" />)}
        {toolbarButton('Italic', () => runCommand('italic'), <Italic className="h-4 w-4" />)}
        {toolbarButton('Underline', () => runCommand('underline'), <Underline className="h-4 w-4" />)}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {toolbarButton('Bulleted list', () => runCommand('insertUnorderedList'), <List className="h-4 w-4" />)}
        {toolbarButton('Numbered list', () => runCommand('insertOrderedList'), <ListOrdered className="h-4 w-4" />)}
        {toolbarButton('Add link', addLink, <LinkIcon className="h-4 w-4" />)}
        <select
          aria-label="Text style"
          defaultValue="p"
          onChange={event => runCommand('formatBlock', event.target.value)}
          className="ml-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-[11px] font-bold text-slate-500 outline-none"
        >
          <option value="p">Paragraph</option>
          <option value="h3">Heading</option>
          <option value="h4">Subheading</option>
          <option value="blockquote">Quote</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emitChange}
        className="rich-text-editor min-h-32 px-3 py-2.5 text-sm text-slate-700 outline-none"
      />
    </div>
  );
};
