/**
 * Caminho de arquivo público respeitando o basePath.
 *
 * O Next prefixa automaticamente o que passa por `next/image`, mas não as tags
 * `img` simples. No GitHub Pages o site vive em /<repo>/, então sem isso as
 * imagens quebram.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (caminho: string) => `${BASE}${caminho}`;
