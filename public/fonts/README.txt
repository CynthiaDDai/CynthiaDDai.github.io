Symbols Nerd Font Mono v3.4.0

Source:
https://github.com/ryanoasis/nerd-fonts/blob/v3.4.0/patched-fonts/NerdFontsSymbolsOnly/SymbolsNerdFontMono-Regular.ttf

The complete upstream Symbols Only font was converted losslessly to WOFF2
with FontTools. It is not subsetted to any particular website theme.
The adjacent nerd-symbols-LICENSE.txt is the upstream MIT license.

Only private-use characters in prompt-glyph spans use this font. Ordinary
Unicode text and the site's existing text fonts keep their normal rendering.

Conversion:
from fontTools.ttLib import TTFont
font = TTFont('SymbolsNerdFontMono-Regular.ttf')
font.flavor = 'woff2'
font.save('nerd-symbols-mono.woff2')
