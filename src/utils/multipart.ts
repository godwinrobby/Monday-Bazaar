import type { Readable } from 'node:stream';

export interface MultipartFile {
  fieldname: string;
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface MultipartResult {
  fields: Record<string, string>;
  files: MultipartFile[];
}

const MAX_BODY_BYTES = 15 * 1024 * 1024; // 15 MB cap for uploads

/** Read a request stream into a single Buffer, enforcing a size cap. */
export async function collectBody(req: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let len = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    len += buf.length;
    if (len > MAX_BODY_BYTES) throw new Error('Request body too large');
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/** Split a Buffer on every occurrence of `delim`. */
function splitBuffer(buf: Buffer, delim: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let start = 0;
  let idx = buf.indexOf(delim, start);
  while (idx !== -1) {
    out.push(buf.slice(start, idx));
    start = idx + delim.length;
    idx = buf.indexOf(delim, start);
  }
  out.push(buf.slice(start));
  return out;
}

export function getBoundary(contentType: string): string | null {
  const m = contentType && contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);
  return m ? (m[1] || m[2]).trim() : null;
}

function parseHeader(headerBlock: string): { fieldName: string; fileName?: string } {
  const line = headerBlock.split('\r\n')[0] || '';
  const nameMatch = line.match(/name="([^"]*)"/);
  const fileMatch = line.match(/filename="([^"]*)"/);
  return { fieldName: nameMatch ? nameMatch[1] : '', fileName: fileMatch ? fileMatch[1] : undefined };
}

/** Minimal, dependency-free multipart/form-data parser for file uploads. */
export function parseMultipart(body: Buffer, boundary: string): MultipartResult {
  const delim = Buffer.from('--' + boundary);
  const parts = splitBuffer(body, delim);
  const result: MultipartResult = { fields: {}, files: [] };

  // parts[0] = preamble, parts[parts.length-1] = closing epilogue (starts with "--")
  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i];
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerBlock = part.slice(0, headerEnd).toString('utf8').trim();
    // content includes a trailing \r\n that precedes the next delimiter
    let content = part.slice(headerEnd + 4, part.length - 2);
    // Guard against the rare case where the part had no trailing CRLF
    if (content.length && content[content.length - 1] === '\n'.charCodeAt(0)) {
      content = content.slice(0, -1);
      if (content.length && content[content.length - 1] === '\r'.charCodeAt(0)) content = content.slice(0, -1);
    }
    const { fieldName, fileName } = parseHeader(headerBlock);
    if (!fieldName) continue;

    const ctMatch = headerBlock.match(/content-type:\s*(.+)/i);
    const contentType = ctMatch ? ctMatch[1].trim() : (fileName ? 'application/octet-stream' : 'text/plain');

    if (fileName !== undefined) {
      result.files.push({ fieldname: fieldName, filename: fileName, contentType, content });
    } else {
      result.fields[fieldName] = content.toString('utf8');
    }
  }
  return result;
}
