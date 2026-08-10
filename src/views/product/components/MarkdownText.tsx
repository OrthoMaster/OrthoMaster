import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { palette } from '../lib/Theme';

// ============================================================
// Minimal markdown → React Native renderer.
//
// Deliberately dependency-free: react-native-markdown-display pulls in
// a full commonmark parser plus its own styling layer, which is more
// than pathology memos need. Supported syntax:
//
//   # .. ###### headings          **bold**  __bold__
//   - / * / + bullet lists        *italic*  _italic_
//   1. ordered lists              `inline code`
//   > blockquote                  [label](url)
//   ---  horizontal rule          ``` fenced code blocks
//   | simple | tables |
//
// Anything unrecognised falls through as plain paragraph text, so a
// memo never renders blank.
// ============================================================

type Block =
  | { t: 'heading'; level: number; text: string }
  | { t: 'paragraph'; text: string }
  | { t: 'list'; ordered: boolean; items: string[] }
  | { t: 'code'; text: string }
  | { t: 'quote'; text: string }
  | { t: 'hr' }
  | { t: 'table'; header: string[]; rows: string[][] };

export function MarkdownText({ content }: { content?: string | null }) {
  const blocks = React.useMemo(() => parseBlocks(content ?? ''), [content]);
  if (blocks.length === 0) return null;
  return <View>{blocks.map((b, i) => renderBlock(b, i))}</View>;
}

// ---------- block parsing ----------

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push({ t: 'paragraph', text: para.join(' ').trim() });
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { flushPara(); continue; }

    // Fenced code block
    if (/^```/.test(trimmed)) {
      flushPara();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      out.push({ t: 'code', text: buf.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^([-*_])\s*(\1\s*){2,}$/.test(trimmed)) {
      flushPara();
      out.push({ t: 'hr' });
      continue;
    }

    // Heading
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      out.push({ t: 'heading', level: h[1].length, text: h[2].trim() });
      continue;
    }

    // Blockquote — consume consecutive "> " lines
    if (/^>\s?/.test(trimmed)) {
      flushPara();
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      i--;
      out.push({ t: 'quote', text: buf.join(' ').trim() });
      continue;
    }

    // Table — a pipe row followed by a separator row
    if (trimmed.includes('|') && i + 1 < lines.length &&
        /^[\s|:\-]+$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      flushPara();
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i].trim()));
        i++;
      }
      i--;
      out.push({ t: 'table', header, rows });
      continue;
    }

    // List — consume consecutive items of the same kind
    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const b = t.match(/^[-*+]\s+(.*)$/);
        const n = t.match(/^\d+[.)]\s+(.*)$/);
        if (ordered && n) items.push(n[1]);
        else if (!ordered && b) items.push(b[1]);
        else break;
        i++;
      }
      i--;
      out.push({ t: 'list', ordered, items });
      continue;
    }

    para.push(trimmed);
  }

  flushPara();
  return out;
}

function splitRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

// ---------- block rendering ----------

function renderBlock(b: Block, key: number) {
  switch (b.t) {
    case 'heading': {
      const style =
        b.level === 1 ? s.h1 : b.level === 2 ? s.h2 : b.level === 3 ? s.h3 : s.h4;
      return <Text key={key} style={style}>{parseInline(b.text, `h${key}`)}</Text>;
    }
    case 'paragraph':
      return <Text key={key} style={s.p}>{parseInline(b.text, `p${key}`)}</Text>;
    case 'list':
      return (
        <View key={key} style={s.list}>
          {b.items.map((item, j) => (
            <View key={j} style={s.listItem}>
              <Text style={s.bullet}>{b.ordered ? `${j + 1}.` : '•'}</Text>
              <Text style={s.listText}>{parseInline(item, `l${key}-${j}`)}</Text>
            </View>
          ))}
        </View>
      );
    case 'code':
      return (
        <View key={key} style={s.codeBlock}>
          <Text style={s.codeText}>{b.text}</Text>
        </View>
      );
    case 'quote':
      return (
        <View key={key} style={s.quote}>
          <Text style={s.quoteText}>{parseInline(b.text, `q${key}`)}</Text>
        </View>
      );
    case 'hr':
      return <View key={key} style={s.hr} />;
    case 'table': {
      const cols = Math.max(b.header.length, ...b.rows.map(r => r.length), 1);
      return (
        <View key={key} style={s.table}>
          <View style={[s.tr, s.trHead]}>
            {Array.from({ length: cols }).map((_, c) => (
              <View key={c} style={s.td}>
                <Text style={s.thText}>{parseInline(b.header[c] ?? '', `th${key}-${c}`)}</Text>
              </View>
            ))}
          </View>
          {b.rows.map((row, r) => (
            <View key={r} style={s.tr}>
              {Array.from({ length: cols }).map((_, c) => (
                <View key={c} style={s.td}>
                  <Text style={s.tdText}>{parseInline(row[c] ?? '', `td${key}-${r}-${c}`)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
  }
}

// ---------- inline parsing ----------

// Order matters: bold before italic, otherwise "**x**" is eaten as two
// italic markers.
const INLINE_RE =
  /(\*\*|__)([\s\S]+?)\1|(\*|_)([\s\S]+?)\3|`([^`]+)`|\[([^\]]*)\]\(([^)\s]+)\)/g;

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;

  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));

    const k = `${keyPrefix}-${n++}`;
    if (m[2] !== undefined) {
      out.push(<Text key={k} style={s.bold}>{parseInline(m[2], k)}</Text>);
    } else if (m[4] !== undefined) {
      out.push(<Text key={k} style={s.italic}>{parseInline(m[4], k)}</Text>);
    } else if (m[5] !== undefined) {
      out.push(<Text key={k} style={s.inlineCode}>{m[5]}</Text>);
    } else if (m[7] !== undefined) {
      const url = m[7];
      out.push(
        <Text key={k} style={s.link} onPress={() => Linking.openURL(url).catch(() => {})}>
          {m[6] || url}
        </Text>,
      );
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

const s = StyleSheet.create({
  h1: { fontSize: 19, fontFamily: 'Poppins-Bold', color: palette.textPrimary, marginTop: 14, marginBottom: 6, letterSpacing: -0.3 },
  h2: { fontSize: 16.5, fontFamily: 'Poppins-Bold', color: palette.textPrimary, marginTop: 14, marginBottom: 6, letterSpacing: -0.2 },
  h3: { fontSize: 15, fontFamily: 'Poppins-Bold', color: palette.textPrimary, marginTop: 12, marginBottom: 5 },
  h4: { fontSize: 13.5, fontFamily: 'Poppins-Bold', color: palette.textSecondary, marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  p: { fontSize: 14, lineHeight: 21, color: palette.textPrimary, marginBottom: 10 },
  bold: { fontFamily: 'Poppins-Bold', fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { color: '#3B82F6', textDecorationLine: 'underline' },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
  },
  list: { marginBottom: 10, paddingLeft: 2 },
  listItem: { flexDirection: 'row', marginBottom: 5, paddingRight: 6 },
  bullet: { width: 20, fontSize: 14, lineHeight: 21, color: '#3B82F6', fontWeight: '700' },
  listText: { flex: 1, fontSize: 14, lineHeight: 21, color: palette.textPrimary },
  codeBlock: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 10 },
  codeText: { fontFamily: 'Courier', fontSize: 12.5, lineHeight: 18, color: '#374151' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 12,
    paddingVertical: 6,
    marginBottom: 10,
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  quoteText: { fontSize: 13.5, lineHeight: 20, color: palette.textSecondary, fontStyle: 'italic' },
  hr: { height: 1, backgroundColor: palette.border, marginVertical: 14 },
  table: { borderWidth: 1, borderColor: palette.border, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.border },
  trHead: { backgroundColor: '#F3F4F6' },
  td: { flex: 1, paddingHorizontal: 8, paddingVertical: 7, borderRightWidth: 1, borderRightColor: palette.border },
  thText: { fontSize: 12, fontFamily: 'Poppins-Bold', color: palette.textPrimary },
  tdText: { fontSize: 12.5, lineHeight: 18, color: palette.textPrimary },
});