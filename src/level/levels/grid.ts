/**
 * A level's grid, out of its `.txt` file: one line a row, exactly as the
 * file has it. Only the newline that ends the file is dropped, and a `\r`
 * left by an editor on Windows.
 */
export function gridRows(text: string): string[] {
  return text.replace(/\r/g, '').replace(/\n$/, '').split('\n');
}
