import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link2, ExternalLink, Edit, Trash2, X } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor;
}

const LinkEditor: React.FC<Props> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const isLinkActive = editor.isActive('link');

  const openDialog = () => {
    if (isLinkActive) {
      // Editing existing link
      const { href } = editor.getAttributes('link');
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      setUrl(href || '');
      setText(selectedText || '');
      setIsEditing(true);
    } else {
      // Creating new link
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      setUrl('');
      setText(selectedText || '');
      setIsEditing(false);
    }
    setIsOpen(true);
  };

  const applyLink = () => {
    if (!url.trim()) return;

    if (text.trim() && !isEditing) {
      // Insert new link with custom text
      editor.chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    } else {
      // Apply link to selection or update existing
      editor.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }

    closeDialog();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    closeDialog();
  };

  const closeDialog = () => {
    setIsOpen(false);
    setUrl('');
    setText('');
    setIsEditing(false);
  };

  const formatUrl = (inputUrl: string) => {
    if (!inputUrl) return '';
    if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
      return inputUrl;
    }
    return `https://${inputUrl}`;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button 
          className={`p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] ${
            isLinkActive ? 'bg-[#0C3C54]/10 text-[#0C3C54]' : ''
          }`}
          aria-label="Link"
          onClick={openDialog}
        >
          <Link2 size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96 z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Chỉnh sửa link' : 'Thêm link'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0C3C54] focus:border-[#0C3C54]"
                autoFocus
              />
            </div>

            {/* Text Input (only for new links) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hiển thị (tùy chọn)
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập text hiển thị"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0C3C54] focus:border-[#0C3C54]"
                />
              </div>
            )}

            {/* Preview */}
            {url && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Preview:</div>
                <a 
                  href={formatUrl(url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#0C3C54] hover:underline flex items-center gap-1"
                >
                  {text || url}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              {isLinkActive && (
                <button
                  onClick={removeLink}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                  Xóa link
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  Hủy
                </button>
              </Dialog.Close>
              <button
                onClick={applyLink}
                disabled={!url.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#0C3C54] text-white rounded-md hover:bg-[#0C3C54]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Edit size={16} />
                {isEditing ? 'Cập nhật' : 'Thêm link'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LinkEditor; 