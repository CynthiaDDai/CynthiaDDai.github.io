{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = with pkgs; [ nodejs_22 chromium caddy ];
  ASTRO_TELEMETRY_DISABLED = "1";
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  shellHook = ''
    echo "Terminal website dev shell · Node $(node --version)"
    echo "npm ci · npm run dev · npm run build · npm test · npm run test:browser"
  '';
}
