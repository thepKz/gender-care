import React, { useState } from 'react';
import RichTextComposer from '../../components/ui/editor/RichTextComposer';
import ModernCard from '../../components/ui/ModernCard';

const RichTextComposerDemo: React.FC = () => {
  const [output, setOutput] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-[#0C3C54]">Rich Text Composer Demo</h1>

        <ModernCard variant="default" className="p-6 space-y-6">
          <RichTextComposer onSubmit={setOutput} />
        </ModernCard>

        {output && (
          <ModernCard variant="default" className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#0C3C54]">Kết quả HTML</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: output }} />
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default RichTextComposerDemo; 