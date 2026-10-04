{ config, lib, pkgs, ... }:
let
  cfg = config.services.terminal-website;
in {
  options.services.terminal-website = {
    enable = lib.mkEnableOption "the static terminal personal website";
    domain = lib.mkOption { type = lib.types.str; description = "Public hostname for this website."; };
    package = lib.mkOption {
      type = lib.types.package;
      default = import ../default.nix { inherit pkgs; siteUrl = "https://${cfg.domain}"; };
      description = "Built site package with share/terminal-website as its document root.";
    };
  };
  config = lib.mkIf cfg.enable {
    services.caddy.enable = true;
    services.caddy.virtualHosts.${cfg.domain} = {
      extraConfig = ''
        root * ${cfg.package}/share/terminal-website
        encode zstd gzip
        header {
          X-Content-Type-Options nosniff
          Referrer-Policy strict-origin-when-cross-origin
        }
        @assets path /_astro/*
        header @assets Cache-Control "public, max-age=31536000, immutable"
        # Pages are built as about.html and served at /about, as on GitHub Pages.
        try_files {path} {path}.html
        file_server {
          disable_canonical_uris
        }
        handle_errors {
          rewrite * /404.html
          file_server
        }
      '';
    };
    networking.firewall.allowedTCPPorts = [ 80 443 ];
  };
}
