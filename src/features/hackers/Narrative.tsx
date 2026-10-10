import Markdown from 'react-markdown';
import { hackersById, labelOf, objectHref } from '../../data/hackers';

export default function Narrative({ text }: { text: string }) {
  return <div className="hackers-narrative"><Markdown
    urlTransform={url => /^https?:\/\//i.test(url) ? url : ''}
    components={{
      code: ({ children }) => {
        const id = String(children);
        const object = hackersById.get(id);
        return object ? <a href={objectHref(id)} title={id}>{labelOf(object)}</a> : <code>{children}</code>;
      },
      a: ({ href, children }) => href ? <a href={href} rel="noreferrer" target="_blank">{children}</a> : <span>{children}</span>,
      img: ({ alt }) => <span>{alt}</span>,
    }}
  >{text}</Markdown></div>;
}
