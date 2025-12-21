import { createHash } from 'crypto';

export const hashContent = (content: string | Buffer) => {
  const hash = createHash('sha1');
  if (typeof content === 'string') {
    hash.update(content, 'utf-8');
  } else {
    hash.update(content);
  }
  return hash.digest('hex');
};
