{
  description = "RetroFocusWeb - A React TUI application development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and package manager
            nodejs_24
            
            # Development tools
            nodePackages.typescript
            nodePackages.typescript-language-server
            
            # Optional but useful tools
            nodePackages.prettier
            nodePackages.eslint
          ];

          shellHook = ''
            echo "🚀 RetroFocusWeb Development Environment"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Node version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install - Install dependencies"
            echo "  npm run dev - Start development server"
            echo "  npm run build - Build for production"
            echo "  npm run preview - Preview production build"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          '';

          # Set environment variables
          VITE_HMR_TIMEOUT = "10000";
        };
      }
    );
}
