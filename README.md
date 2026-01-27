<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lRe1OfRw-MI2oDuLGb5gYuzrxGakRL8T

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Multi-Device Sync with PocketBase

RetroFocus supports syncing your data across multiple devices using [PocketBase](https://pocketbase.io/).

### Quick Start

1. **Start PocketBase server:**
   ```bash
   pocketbase serve
   ```

2. **Set up admin account:**
   - Open http://127.0.0.1:8090/_/
   - Create your admin account

3. **Import the schema:**
   - Go to Settings → Import Collections
   - Import `pb_schema.json` from this project

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Register/Login in the app:**
   - Click "SYNC: OFFLINE" in the header
   - Create an account or login
   - Your data will now sync across devices!

### Deploying PocketBase

For production use, deploy PocketBase to a server:

- **Fly.io**: https://github.com/pocketbase/pocketbase/discussions/537
- **Railway**: One-click deploy available
- **Self-hosted**: Run the binary on any Linux server

Update `VITE_POCKETBASE_URL` in your environment to point to your deployed instance.

## Nix Development Environment

If you use [Nix](https://nixos.org/), this project includes a `flake.nix` for a reproducible development environment with PocketBase included.

**Prerequisites:** Nix with flakes enabled

### Enable Flakes (if not already enabled)

Add to your `~/.config/nix/nix.conf` or `/etc/nix/nix.conf`:
```
experimental-features = nix-command flakes
```

### Using the Development Shell

1. Enter the development shell:
   ```bash
   nix develop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start PocketBase (in a separate terminal):
   ```bash
   pocketbase serve
   ```

4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

5. Run the app:
   ```bash
   npm run dev
   ```

### Using direnv (Optional)

For automatic environment activation, you can use [direnv](https://direnv.net/):

1. Install direnv via Nix or your package manager
2. Create a `.envrc` file in the project root:
   ```bash
   echo "use flake" > .envrc
   ```
3. Allow direnv:
   ```bash
   direnv allow
   ```

Now the development environment will activate automatically when you `cd` into the project directory!
