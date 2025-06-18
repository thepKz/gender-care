import React, { useCallback, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Bold, Italic, Underline as TextUnderline, Strikethrough, List as UnorderedList, ListOrdered, Quote, Code, Undo2, Redo2, Image as ImageIcon, Link2, Youtube, Indent, Outdent, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Maximize2, Minimize2 } from 'lucide-react';
import * as Toolbar from '@radix-ui/react-toolbar';
import ToolbarButton from './ToolbarButton';
import PrimaryButton from '../primitives/PrimaryButton';
import DOMPurify from 'dompurify';
import { useUploadFile } from '../../../hooks/useUploadFile';
import TextAlign from '@tiptap/extension-text-align';
import Strike from '@tiptap/extension-strike';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
// TipTap yêu cầu instance lowlight; dùng bản common ESM
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createLowlight, common } from 'lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import YoutubeExtension from '@tiptap/extension-youtube';
import HeadingDropdown from './HeadingDropdown';
import ColorPopover from './ColorPopover';
import AlignGroup from './AlignGroup';
import FontSizeDropdown from './FontSizeDropdown';
import FontFamilyDropdown from './FontFamilyDropdown';
import EmojiPicker from './EmojiPicker';
import WordCount from './WordCount';
import TableControls from './TableControls';
import LinkEditor from './LinkEditor';
import * as Tooltip from '@radix-ui/react-tooltip';

interface RichTextComposerProps {
  initialContent?: string;
  placeholder?: string;
  maxHeight?: number; // px
  onSubmit: (html: string) => Promise<void> | void;
}

const RichTextComposer: React.FC<RichTextComposerProps> = ({ initialContent = '', placeholder = 'Cập nhật trạng thái...', maxHeight = 300, onSubmit }) => {
  const { uploadFile } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false, 
        strike: false,
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Strike,
      TextStyle,
      Color,
      Highlight,
      Subscript,
      Superscript,
      TextAlign.configure({ 
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({ 
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 50,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' } }),
      YoutubeExtension.configure({ controls: true }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: `editor-content focus:outline-none p-4 min-h-[120px] bg-white rounded-md border border-gray-300`,
        spellCheck: 'false',
      },
    },
  });

  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const url = await uploadFile(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const execSubmit = useCallback(() => {
    if (!editor) return;
    const dirty = editor.getHTML();
    const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
    onSubmit(clean);
    editor.commands.clearContent();
  }, [editor, onSubmit]);

  // Font size management  
  const setFontSize = (size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  };

  const getCurrentFontSize = () => {
    if (!editor) return '12pt';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontSize || '12pt';
  };

  // Font family management
  const setFontFamily = (family: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontFamily: family }).run();
  };

  const getCurrentFontFamily = () => {
    if (!editor) return 'Arial, sans-serif';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontFamily || 'Arial, sans-serif';
  };

  // Emoji insertion
  const insertEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
  };

  // Indent controls
  const indent = () => {
    if (!editor) return;
    // Simple implementation using margin
    editor.chain().focus().setMark('textStyle', { marginLeft: '2rem' }).run();
  };

  const outdent = () => {
    if (!editor) return;
    editor.chain().focus().unsetMark('textStyle').run();
  };

  // Full screen toggle
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (!editor) return null;

  const containerClasses = isFullScreen 
    ? 'fixed inset-0 z-50 bg-white flex flex-col' 
    : 'space-y-3';

  const editorHeightStyle = isFullScreen 
    ? { height: 'calc(100vh - 200px)' }
    : { maxHeight };

  return (
    <div className={containerClasses}>
      {/* Custom CSS for TipTap editor */}
      <style>{`
        .editor-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.2;
          color: #0C3C54;
        }
        .editor-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.3;
          color: #0C3C54;
        }
        .editor-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.4;
          color: #0C3C54;
        }
        .editor-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem 0;
          line-height: 1.4;
          color: #0C3C54;
        }
        .editor-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .editor-content ul, .editor-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .editor-content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .editor-content ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin: 0.25rem 0;
        }
        .editor-content ul[data-type="taskList"] li > label {
          margin-right: 0.5rem;
          margin-top: 0.125rem;
        }
        .editor-content ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .editor-content table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
          border: 1px solid #e5e7eb;
        }
        .editor-content table td, .editor-content table th {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          vertical-align: top;
        }
        .editor-content table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .editor-content blockquote {
          border-left: 4px solid #0C3C54;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .editor-content pre {
          background: #f3f4f6;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        .editor-content code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .editor-content sub {
          vertical-align: sub;
          font-size: smaller;
        }
        .editor-content sup {
          vertical-align: super;
          font-size: smaller;
        }
      `}</style>

      {/* Toolbar */}
      <Tooltip.Provider delayDuration={300}>
        <Toolbar.Root className="flex flex-wrap items-center gap-1 bg-gray-50 p-2 rounded-md border border-gray-300 relative z-10">
          {/* Text Formatting */}
          <ToolbarButton
            ariaLabel="Bold"
            icon={<Bold size={18} />}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            ariaLabel="Italic"
            icon={<Italic size={18} />}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            ariaLabel="Underline"
            icon={<TextUnderline size={18} />}
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            ariaLabel="Strike"
            icon={<Strikethrough size={18} />}
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            ariaLabel="Subscript"
            icon={<SubscriptIcon size={18} />}
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          />
          <ToolbarButton
            ariaLabel="Superscript"
            icon={<SuperscriptIcon size={18} />}
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Typography */}
          <HeadingDropdown
            setHeading={(lvl)=>{
              if(lvl){
                editor.chain().focus().toggleHeading({level:lvl as any}).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
            editorIsActive={(lvl)=>editor.isActive('heading',{level:lvl})}
          />
          
          <FontFamilyDropdown
            setFontFamily={setFontFamily}
            getCurrentFontFamily={getCurrentFontFamily}
          />
          
          <FontSizeDropdown
            setFontSize={setFontSize}
            getCurrentFontSize={getCurrentFontSize}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Colors */}
          <ColorPopover 
            ariaLabel="Màu chữ" 
            type="text"
            onChange={(c)=>editor.chain().focus().setColor(c).run()} 
            onClear={()=>editor.chain().focus().unsetColor().run()}
          />
          <ColorPopover 
            ariaLabel="Màu nền" 
            type="highlight"
            onChange={(c)=>editor.chain().focus().toggleHighlight({ color:c }).run()} 
            onClear={()=>editor.chain().focus().unsetHighlight().run()}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Alignment & Indent */}
          <AlignGroup
            setAlign={(v)=>editor.chain().focus().setTextAlign(v as any).run()}
            isActive={(v)=>editor.isActive({textAlign:v})}
          />
          
          <ToolbarButton
            ariaLabel="Indent"
            icon={<Indent size={18} />}
            onClick={indent}
          />
          <ToolbarButton
            ariaLabel="Outdent"
            icon={<Outdent size={18} />}
            onClick={outdent}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Lists */}
          <ToolbarButton
            ariaLabel="Bullet List"
            icon={<UnorderedList size={18} />}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            ariaLabel="Ordered List"
            icon={<ListOrdered size={18} />}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            ariaLabel="Task List"
            icon={<div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center"><div className="w-2 h-2 bg-gray-400 rounded-sm"></div></div>}
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
          <ToolbarButton
            ariaLabel="Quote"
            icon={<Quote size={18} />}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Code & Table */}
          <ToolbarButton
            ariaLabel="Code"
            icon={<Code size={18} />}
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <TableControls editor={editor} />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Media & Special */}
          <LinkEditor editor={editor} />
          <ToolbarButton
            ariaLabel="Image"
            icon={<ImageIcon size={18} />}
            onClick={() => fileInputRef.current?.click()}
          />
          <ToolbarButton
            ariaLabel="YouTube"
            icon={<Youtube size={18} />}
            onClick={() => {
              const url = window.prompt('Nhập YouTube URL');
              if (url) {
                editor.chain().focus().setYoutubeVideo({ src: url }).run();
              }
            }}
          />
          <EmojiPicker onEmojiSelect={insertEmoji} />
          <input hidden type="file" accept="image/*" ref={fileInputRef} onChange={handleImageInsert} />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Actions */}
          <ToolbarButton
            ariaLabel="Undo"
            icon={<Undo2 size={18} />}
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            ariaLabel="Redo"
            icon={<Redo2 size={18} />}
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          />
          
          <Toolbar.Separator className="w-px h-5 bg-gray-300 mx-1" />
          
          {/* Full Screen */}
          <ToolbarButton
            ariaLabel={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            icon={isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            onClick={toggleFullScreen}
          />
        </Toolbar.Root>
      </Tooltip.Provider>

      {/* Editor */}
      <div 
        style={editorHeightStyle} 
        className={`overflow-auto bg-white rounded-md border border-gray-300 ${isFullScreen ? 'flex-1' : ''}`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border border-gray-300 rounded-md">
        <WordCount editor={editor} />
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <PrimaryButton onClick={execSubmit} disabled={editor.isEmpty}>Đăng</PrimaryButton>
          <PrimaryButton variant="outline" onClick={() => fileInputRef.current?.click()}>Đính kèm tập tin</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default RichTextComposer; 