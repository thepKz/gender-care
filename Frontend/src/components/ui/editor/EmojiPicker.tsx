import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Smile, Search } from 'lucide-react';

interface Props {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<Props> = ({ onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'Objects': ['💻', '📱', '⌚', '📷', '🎥', '📺', '🎮', '🕹️', '💾', '💿', '📀', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💳', '💎', '⚖️', '🔧', '🔨', '⛏️', '🔩'],
    'Nature': ['🌱', '🌿', '🍀', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🥀', '🌹', '🌲', '🌳', '🌴', '🎋', '🎍', '🌵', '🌶️', '🍄', '🌰', '🎃', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨'],
    'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
  };

  const allEmojis = Object.values(emojiCategories).flat();
  
  const filteredEmojis = searchTerm 
    ? allEmojis.filter(emoji => 
        // Simple search - could be enhanced with emoji names
        emoji.includes(searchTerm)
      )
    : allEmojis.slice(0, 48); // Show first 48 emojis by default

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          className="p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54]"
          aria-label="Insert Emoji"
        >
          <Smile size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          side="bottom" 
          className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-50 w-80"
          sideOffset={5}
        >
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm emoji..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#0C3C54] focus:border-[#0C3C54]"
              />
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => onEmojiSelect(emoji)}
                  className="p-2 rounded hover:bg-gray-100 transition-colors text-xl"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Categories */}
            {!searchTerm && (
              <div className="border-t pt-3">
                <div className="text-xs text-gray-500 mb-2">Categories</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <button
                      key={category}
                      onClick={() => {
                        // Focus on first emoji of category
                        onEmojiSelect(emojis[0]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title={category}
                    >
                      {emojis[0]} {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default EmojiPicker; 