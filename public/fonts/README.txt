Fonts served by the site. They are set up in src/styles/fonts.css.

nerd-symbols-mono.woff2
  Symbols Nerd Font Mono v3.4.0, MIT (nerd-symbols-LICENSE.txt).
  https://github.com/ryanoasis/nerd-fonts/blob/v3.4.0/patched-fonts/NerdFontsSymbolsOnly/SymbolsNerdFontMono-Regular.ttf
  The complete Symbols Only font, converted losslessly to WOFF2 with FontTools:
    from fontTools.ttLib import TTFont
    font = TTFont('SymbolsNerdFontMono-Regular.ttf')
    font.flavor = 'woff2'
    font.save('nerd-symbols-mono.woff2')
  Only private-use characters in prompt-glyph spans use this font.

maple-mono-{regular,italic,medium,semibold,bold}.woff2
  Maple Mono v7.9, SIL Open Font License 1.1 (maple-mono-LICENSE.txt).
  https://github.com/subframe7536/maple-font/releases/tag/v7.9, MapleMono-Woff2.zip, renamed.

huiwen-mincho.subset.woff2
  Huiwen Mincho, improved (汇文明朝体 符号修正版), release 20241203, CC0 1.0 (huiwen-mincho-LICENSE.txt).
  https://github.com/bosswnx/huiwenmincho-improved, based on 汇文明朝体 by 特里王.
  The build keeps only the characters the site uses (scripts/subset-fonts.mjs).
