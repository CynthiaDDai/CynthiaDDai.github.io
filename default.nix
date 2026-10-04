{ pkgs ? import <nixpkgs> {}, siteUrl ? "https://example.com" }:
pkgs.buildNpmPackage {
  pname = "terminal-personal-website";
  version = "0.3.0";
  src = pkgs.lib.cleanSourceWith {
    src = ./.;
    filter = path: type:
      let name = baseNameOf path;
      in !(builtins.elem name [ "node_modules" "dist" ".astro" ".git" "test-results" "playwright-report" ".env" ]);
  };
  nodejs = pkgs.nodejs_22;
  npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
  npmConfigHook = pkgs.importNpmLock.npmConfigHook;
  npmBuildScript = "build";
  ASTRO_TELEMETRY_DISABLED = "1";
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
  PUBLIC_SITE_URL = siteUrl;
  installPhase = ''
    runHook preInstall
    mkdir -p "$out/share/terminal-website"
    cp -r dist/. "$out/share/terminal-website/"
    runHook postInstall
  '';
}
