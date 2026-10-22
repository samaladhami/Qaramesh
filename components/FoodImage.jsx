'use client';
import { useState } from 'react';
import Image from 'next/image';
export default function FoodImage({ src, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <div className={`food-image ${className} ${!loaded && !failed ? 'image-loading' : ''}`}>
    {src && !failed ? <Image src={src} alt={alt} fill sizes="(max-width: 540px) 150px, (max-width: 900px) 45vw, 380px" loading={eager ? 'eager' : 'lazy'} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} /> : <div className="image-fallback"><span aria-hidden="true">✦</span><span>قراميش</span></div>}
  </div>;
}
