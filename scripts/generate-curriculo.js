// Gera um PDF de texto selecionável a partir do currículo em Markdown.
// Execute na raiz do projeto: node scripts/generate-curriculo.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/curriculo-vinicius-alochio.md'), 'utf8');
const output = path.join(root, 'assets/vinicius-alochio.pdf');
const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 46;
const maxWidth = pageWidth - margin * 2;
const pages = [];
let commands = [];
let cursor = 46;

function clean(value) {
  return value.normalize('NFC').replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x00-\xFF]/g, '');
}

function literal(value) {
  return clean(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function width(value, size) {
  let units = 0;
  for (const char of clean(value)) {
    if (char === ' ') units += .28;
    else if (/[MW@#%]/.test(char)) units += .87;
    else if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(char)) units += .69;
    else if (/[ilI.,;:'!|]/.test(char)) units += .27;
    else if (/[fjrt]/.test(char)) units += .38;
    else units += .53;
  }
  return units * size;
}

function wrap(value, size, availableWidth) {
  const result = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && width(next, size) > availableWidth) {
      result.push(line);
      line = word;
    } else line = next;
  }
  if (line) result.push(line);
  return result;
}

function newPage() {
  if (commands.length) pages.push(commands);
  commands = [];
  cursor = 46;
}

function ensureSpace(height) {
  if (cursor + height > pageHeight - 52) newPage();
}

function text(value, options = {}) {
  const size = options.size ?? 9.5;
  const leading = options.leading ?? 13;
  const indent = options.indent ?? 0;
  const lines = wrap(value, size, maxWidth - indent);
  const color = options.color ?? '0.11 0.15 0.22';
  const font = options.bold ? 'F2' : 'F1';
  for (const line of lines) {
    ensureSpace(leading);
    const x = (margin + indent).toFixed(2);
    const y = (pageHeight - cursor).toFixed(2);
    commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${literal(line)}) Tj ET`);
    cursor += leading;
  }
  cursor += options.after ?? 0;
}

function section(value) {
  ensureSpace(48);
  cursor += 13;
  text(value, { size: 10.6, leading: 16, bold: true, color: '0.06 0.30 0.58', after: 4 });
  const y = (pageHeight - cursor + 2).toFixed(2);
  commands.push(`0.78 0.84 0.90 RG 0.6 w ${margin} ${y} m ${pageWidth - margin} ${y} l S`);
  cursor += 7;
}

function role(value) {
  ensureSpace(100);
  cursor += 7;
  text(value, { size: 10.4, leading: 14, bold: true, after: 1 });
}

for (const raw of source.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('# ')) {
    text(line.slice(2), { size: 18, leading: 23, bold: true, color: '0.05 0.13 0.27', after: 2 });
  } else if (line.startsWith('## ')) {
    section(line.slice(3));
  } else if (line.startsWith('### ')) {
    role(line.slice(4));
  } else if (line.startsWith('- ')) {
    text(`- ${line.slice(2)}`, { size: 9.2, leading: 12.4, indent: 9, after: 3 });
  } else {
    text(line, { size: 9.4, leading: 13, after: 3 });
  }
}
if (commands.length) pages.push(commands);

const objects = [];
const add = (value) => { objects.push(value); return objects.length; };
const catalogId = add('');
const pagesId = add('');
const regularId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
const boldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
const infoId = add(`<< /Title (${literal('Currículo - Vinícius Alochio Santos')}) /Author (${literal('Vinícius Alochio Santos')}) /Subject (${literal('Desenvolvedor Full Stack e Consultor em Automação Industrial')}) /Keywords (${literal('React, TypeScript, JavaScript, Node.js, Python, SQL Server, APIs REST, Full Stack, Automação Industrial, Visão Computacional, YOLO')}) >>`);
const pageIds = [];

for (let index = 0; index < pages.length; index++) {
  const pageCommands = pages[index].slice();
  pageCommands.push(`BT /F1 8 Tf 0.42 0.48 0.56 rg 1 0 0 1 ${margin} 30 Tm (${literal(`Vinícius Alochio Santos | Página ${index + 1} de ${pages.length}`)}) Tj ET`);
  const stream = pageCommands.join('\n') + '\n';
  const pageId = add('');
  const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`);
  pageIds.push(pageId);
  objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
}

objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;

const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
const offsets = [0];
let position = chunks[0].length;
for (let index = 0; index < objects.length; index++) {
  offsets.push(position);
  const part = Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, 'latin1');
  chunks.push(part);
  position += part.length;
}
const xrefStart = position;
const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
for (const offset of offsets.slice(1)) xref.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
xref.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
chunks.push(Buffer.from(xref.join(''), 'latin1'));
fs.writeFileSync(output, Buffer.concat(chunks));
console.log(`Currículo gerado: ${pages.length} página(s), ${fs.statSync(output).size} bytes`);
