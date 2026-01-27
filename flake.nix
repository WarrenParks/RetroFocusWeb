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
            echo "  pocketbase serve                         - Local only (127.0.0.1:8090)"
            echo "  pocketbase serve --http=0.0.0.0:8090     - Expose to network"
            echo "  pb-dev                                   - Network mode with CORS enabled"
            echo ""
            echo "First time setup:"
            echo "  1. Run: pocketbase serve"
            echo "  2. Open: http://127.0.0.1:8090/_/"
            echo "  3. Create admin account"
            echo "  4. Import schema from pb_schema.json"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            # Helper alias for running PocketBase with CORS enabled for local network dev
            pb-dev() {
              echo "Starting PocketBase with CORS enabled for all origins..."
              echo "Access admin UI at: http://$(hostname -I | awk '{print $1}'):8090/_/"
              pocketbase serve --http=0.0.0.0:8090 --origins="*"
            }
          '';

          # Set environment variables
          VITE_HMR_TIMEOUT = "10000";
          #VITE_POCKETBASE_URL = "http://127.0.0.1:8090";
          VITE_POCKETBASE_URL = "http://192.168.1.121:8090";
        };
      }
    );
}
