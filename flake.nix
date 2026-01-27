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
            
            # PocketBase backend
            pocketbase
            
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
            echo "PocketBase version: $(pocketbase --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install    - Install dependencies"
            echo "  npm run dev    - Start development server"
            echo "  npm run build  - Build for production"
            echo "  npm run preview - Preview production build"
            echo ""
            echo "PocketBase commands:"
            echo "  pocketbase serve - Start PocketBase server (default: http://127.0.0.1:8090)"
            echo "  pocketbase serve --http=0.0.0.0:8090 - Expose to network"
            echo ""
            echo "First time setup:"
            echo "  1. Run: pocketbase serve"
            echo "  2. Open: http://127.0.0.1:8090/_/"
            echo "  3. Create admin account"
            echo "  4. Import schema from pb_schema.json"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          '';

          # Set environment variables
          VITE_HMR_TIMEOUT = "10000";
          VITE_POCKETBASE_URL = "http://127.0.0.1:8090";
        };
      }
    );
}
