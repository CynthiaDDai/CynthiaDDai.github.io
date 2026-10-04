import source from '../../../config.jsonc?raw';
import { parseFastfetchTheme } from './fastfetch-parser';

// Normalize at build time; only the website's appearance reaches the browser.
export const fastfetch = parseFastfetchTheme(source);
