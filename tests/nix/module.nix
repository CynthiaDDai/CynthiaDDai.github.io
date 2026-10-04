let
  pkgs = import <nixpkgs> {};
  evaluated = import (pkgs.path + "/nixos/lib/eval-config.nix") {
    system = pkgs.stdenv.hostPlatform.system;
    modules = [
      ../../nix/module.nix
      {
        system.stateVersion = "26.05";
        services.terminal-website.enable = true;
        services.terminal-website.domain = "website.example";
      }
    ];
  };
  cfg = evaluated.config;
  host = cfg.services.caddy.virtualHosts."website.example";
in
assert cfg.services.caddy.enable;
assert !cfg.services.nginx.enable;
assert builtins.elem 80 cfg.networking.firewall.allowedTCPPorts;
assert builtins.elem 443 cfg.networking.firewall.allowedTCPPorts;
{
  caddyConfig = host.extraConfig;
  sitePackage = toString cfg.services.terminal-website.package;
  publicUrl = cfg.services.terminal-website.package.PUBLIC_SITE_URL;
}
