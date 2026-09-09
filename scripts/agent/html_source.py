"""Small standard-library reader for the pinned OASIS HTML document."""
from html.parser import HTMLParser
import re

class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c if isinstance(c, str) else c.text()+' ' for c in self.children)).strip()
    def all(self, tags):
        for c in self.children:
            if isinstance(c, Node):
                if c.tag in tags: yield c
                yield from c.all(tags)
    def anchor(self):
        for a in self.all(['a']):
            if a.attrs.get('name'): return a.attrs['name']
        return self.attrs.get('id', '')

class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.current = self.root
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        node=Node(tag, attrs, self.current); self.current.children.append(node)
        if tag not in ['br','hr','img','meta','link','input','wbr','source']: self.current=node
    def handle_endtag(self, tag):
        n=self.current
        while n.parent:
            if n.tag==tag: self.current=n.parent; return
            n=n.parent
    def handle_data(self, data): self.current.children.append(data)
