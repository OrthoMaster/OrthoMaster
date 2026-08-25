// Pull a preview paragraph out of a pathology memo.
//
// Preferred source is the text between the H1 and the next heading —
// that's the clinical definition. But many memos jump straight from H1
// to H2 with nothing in between, which used to yield an empty string
// and silently hide the card. So the search cascades:
//
//   1. section right after the first heading  ← what we actually want
//   2. any later section that has prose
//   3. the preamble before the first heading
//
// Only a memo with no prose at all returns ''.
export function extractIntro(md?: string | null): string {
  if (!md) return '';

  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const isHeading = (l: string) => /^\s{0,3}#{1,6}\s+/.test(l);

  // Split into the blocks that headings separate. sections[0] is
  // whatever sits before the first heading (often empty).
  const sections: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (isHeading(line)) {
      sections.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  sections.push(current);

  const ordered = sections.length > 1
    ? [sections[1], ...sections.slice(2), sections[0]]
    : sections;

  for (const sec of ordered) {
    const text = stripMarkdown(sec.join('\n'));
    if (text !== '') return text;
  }
  return '';
}

// Flatten inline syntax to plain text — the preview renders in a single
// <Text>, so bold/link/code markers would show up as literal characters.
function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/^\s*[-:|\s]+$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}