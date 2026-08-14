'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithSkeletonProps extends Omit<ImageProps, 'onLoad'> {
  skeletonClassName?: string;
  useNextImage?: boolean;
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className, 
  skeletonClassName, 
  useNextImage = true,
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isLoading && (
        <Skeleton className={cn("absolute inset-0 z-0 h-full w-full", skeletonClassName)} />
      )}
      
      {useNextImage ? (
        <Image
          {...props}
          src={src}
          alt={alt}
          className={cn(className, "transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100 z-10 relative")}
          onLoadingComplete={() => setIsLoading(false)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...(props as any)}
          src={src as string}
          alt={alt}
          className={cn(className, "transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100 z-10 relative")}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}

