import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'avatar', size = 56, className = '' }) => {
  return (
    <AvatarPrimitive.Root
      className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <AvatarPrimitive.Image src={src} alt={alt} className="object-cover w-full h-full" />
      <AvatarPrimitive.Fallback
        delayMs={600}
        className="flex items-center justify-center w-full h-full text-gray-400 text-sm bg-gray-100"
      >
        ?
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
};

export default Avatar;
