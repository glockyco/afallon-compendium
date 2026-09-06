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
    in {
      devShells = forAllSystems (system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.mkShellNoCC {
            packages = [ pkgs.bun pkgs.nodejs_24 pkgs.git pkgs.sqlite pkgs.uv pkgs.python313 ];
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
