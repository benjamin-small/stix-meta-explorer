import { useState } from 'react';
import type { StoryMedia } from './story-media';

export default function StoryImage({ media }: { media: StoryMedia }) {
  const [failed, setFailed] = useState(false);
  return <figure className="story-image">
    {failed ? <div className="story-image-fallback" role="img" aria-label={media.alt}>Film still unavailable</div> :
      <img src={media.src} alt={media.alt} width={960} height={408} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
    <figcaption><span>{media.caption}</span><a href={media.source} target="_blank" rel="noreferrer">Film still · source ↗</a></figcaption>
  </figure>;
}
