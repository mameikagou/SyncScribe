// 负责切片

/**
 * Recursively split a long string into smaller chunks with a given size.
 *
 * This function tries to split the string at the end of a line or a word boundary
 * to avoid breaking words in half. It also keeps a specified amount of characters
 * from the previous chunk at the beginning of the next chunk to ensure that the
 * resulting chunks can be concatenated without losing any information.
 *
 * @param {string} text - The string to be split.
 * @param {number} chunkSize - The desired size of each chunk. Defaults to 1000.
 * @param {number} overlap - The number of characters to keep from the previous chunk
 *                         at the beginning of the next chunk. Defaults to 100.
 * @returns {string[]} - An array of strings, each representing a chunk of the original string.
 */
export function recursiveChunking(text: string, chunkSize = 1000, overlap = 100): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // 如果没到末尾，尝试在并在空格或换行处切断，避免切断单词
    if (end < text.length) {
      // 优先找换行符
      const lastNewLine = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);

      const candidates = [lastNewLine, lastSpace].filter((pos) => pos>start);

      if(candidates.length > 0) {
        end = Math.max(...candidates);
      }
    }
    chunks.push(text.slice(start, end).trim());

    // 移动指针，从新的end部分开始找。因为换行符和空格的不同，会有部分的
    const minAdvance = Math.max(1, chunkSize - overlap);
    start = Math.min(end, start + minAdvance);
  }
  return chunks;
}


// while pos < len(data):
//     end = pos + batch_size
//     if should_split_at_boundary(end):
//         end = find_safe_split(end)
//     chunks.append(data[pos:end])
//     pos = end - overlap

// 但是这个有个bug，会进入死循环。比如，
// 文本: "llo world.\nThis is a test document..."
// 位置:  2         12  15                  32
//         ↓         ↓   ↓                   ↓
//         "llo world.\nThis is a test documen"

// 这里第一次找到的结束点是12，回退之后pos在2的位置，再找还是12.

// 第一次优化：pos = max(end, end - overlap)

// 但是这样不过是从3到12了，一样有问题。