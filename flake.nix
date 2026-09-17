{
  description = "Afallon Compendium extraction, screenshot capture, and map";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.2605";
    fleet = {
      url = "github:glockyco/omp-agent-setup";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, fleet }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      bunVersion = "1.4.0";
      bunSources = {
        aarch64-darwin = { archive = "bun-darwin-aarch64.zip"; sha256 = "c669e97f6164e1c96e0701748db98dfa77492908cbd8394c7557134a735de381"; };
        x86_64-darwin = { archive = "bun-darwin-x64-baseline.zip"; sha256 = "da9b9f1b4ba766c6f299711f38dfaa98623e1ed9c40896aa53db803c52ec1fa0"; };
        aarch64-linux = { archive = "bun-linux-aarch64.zip"; sha256 = "4b1a332ee861983eb93bcfe6f770fff94e3e31b2c388bdaea3c8ed35e58eed0e"; };
        x86_64-linux = { archive = "bun-linux-x64-baseline.zip"; sha256 = "184fb4595f0d401a217cf7c78c1bc430ba83314dab7a8b94805babbf7fa7097f"; };
      };
    in {
      devShells = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          source = bunSources.${system};
          bun = pkgs.bun.overrideAttrs {
            version = bunVersion;
            src = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${source.archive}";
              inherit (source) sha256;
            };
          };
        in {
          default = pkgs.mkShellNoCC {
            packages = [ bun pkgs.nodejs_24 pkgs.git pkgs.sqlite pkgs.uv pkgs.python313 ];
            AFALLON_DEV_SHELL = "1";
            UV_PYTHON_DOWNLOADS = "never";
          };
          analysis = pkgs.mkShellNoCC {
            packages = [ pkgs.ghidra pkgs.llvmPackages.llvm ];
          };
        });
      checks = forAllSystems (system: {
        devShell = self.devShells.${system}.default;
        openspec = fleet.lib.openspecCheck {
          pkgs = nixpkgs.legacyPackages.${system};
          src = ./.;
        };
      });
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt-tree);
    };
}
