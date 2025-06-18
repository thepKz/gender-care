import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Table as TableIcon, Plus, Minus, Trash2, Move } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor;
}

const TableControls: React.FC<Props> = ({ editor }) => {
  const isTableActive = editor.isActive('table');

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addRowBefore = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const addColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  const toggleHeaderRow = () => {
    editor.chain().focus().toggleHeaderRow().run();
  };

  const toggleHeaderColumn = () => {
    editor.chain().focus().toggleHeaderColumn().run();
  };

  const mergeCells = () => {
    editor.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    editor.chain().focus().splitCell().run();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          className={`p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] ${
            isTableActive ? 'bg-[#0C3C54]/10 text-[#0C3C54]' : ''
          }`}
          aria-label="Table"
        >
          <TableIcon size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm z-50 min-w-[200px]">
          {!isTableActive ? (
            <DropdownMenu.Item 
              onSelect={insertTable}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <TableIcon size={16} />
              <span>Chèn bảng</span>
            </DropdownMenu.Item>
          ) : (
            <>
              {/* Row Controls */}
              <div className="text-xs text-gray-500 px-3 py-1 mb-1">Hàng (Row)</div>
              <DropdownMenu.Item 
                onSelect={addRowBefore}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} />
                <span>Thêm hàng trên</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={addRowAfter}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} />
                <span>Thêm hàng dưới</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={deleteRow}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Minus size={16} />
                <span>Xóa hàng</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />

              {/* Column Controls */}
              <div className="text-xs text-gray-500 px-3 py-1 mb-1">Cột (Column)</div>
              <DropdownMenu.Item 
                onSelect={addColumnBefore}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} />
                <span>Thêm cột trái</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={addColumnAfter}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} />
                <span>Thêm cột phải</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={deleteColumn}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Minus size={16} />
                <span>Xóa cột</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />

              {/* Cell Controls */}
              <div className="text-xs text-gray-500 px-3 py-1 mb-1">Ô (Cell)</div>
              <DropdownMenu.Item 
                onSelect={mergeCells}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Move size={16} />
                <span>Gộp ô</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={splitCell}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Move size={16} />
                <span>Tách ô</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />

              {/* Header Controls */}
              <div className="text-xs text-gray-500 px-3 py-1 mb-1">Header</div>
              <DropdownMenu.Item 
                onSelect={toggleHeaderRow}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <TableIcon size={16} />
                <span>Toggle Header Row</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onSelect={toggleHeaderColumn}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <TableIcon size={16} />
                <span>Toggle Header Column</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />

              {/* Danger Zone */}
              <DropdownMenu.Item 
                onSelect={deleteTable}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
                <span>Xóa toàn bộ bảng</span>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default TableControls; 