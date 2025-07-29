import React from 'react';

/**
 * Subtle blob background – two large, blurred circles that drift slowly.
 * Keeps text legible while adding a touch of motion.
 */
export const BlobBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Top-left blob */}
      <div
        className="absolute bg-indigo-500 opacity-20 mix-blend-screen rounded-full blur-3xl"
        style={{
          width: '40rem',
          height: '40rem',
          top: '-10rem',
          left: '-10rem',
          animation: 'blob-move-1 25s ease-in-out infinite',
        }}
      />

      {/* Bottom-right blob */}
      <div
        className="absolute bg-blue-600 opacity-15 mix-blend-screen rounded-full blur-3xl"
        style={{
          width: '30rem',
          height: '30rem',
          bottom: '-8rem',
          right: '-8rem',
          animation: 'blob-move-2 30s ease-in-out infinite',
        }}
      />
    </div>
  );
}; 