# Installing Supabase CLI

The Supabase CLI **cannot be installed via `npm install -g supabase`** anymore. Use one of these methods:

## Windows Installation Methods

### Method 1: Scoop (Recommended)
Scoop is a package manager for Windows.

```powershell
# 1. Install Scoop (if you don't have it)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Add Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# 3. Install Supabase CLI
scoop install supabase

# 4. Verify installation
supabase --version
```

### Method 2: Chocolatey
If you have Chocolatey installed:

```powershell
choco install supabase
```

### Method 3: npx (No Installation)
You can use Supabase CLI without installing it:

```bash
# Use npx prefix for all commands
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase functions deploy movies
```

**Note:** This downloads the CLI each time, so it's slower but works without installation.

### Method 4: Manual Download
1. Go to https://github.com/supabase/cli/releases
2. Download the latest `supabase_windows_amd64.zip`
3. Extract the `supabase.exe` file
4. Add it to your PATH, or use it directly from the folder

## Verify Installation

After installing, verify it works:

```bash
supabase --version
```

You should see something like: `supabase 2.x.x`

## Troubleshooting

**"supabase: command not found"**
- Make sure the installation directory is in your PATH
- Restart your terminal/PowerShell after installation
- For Scoop: `scoop install supabase` should add it to PATH automatically

**Permission errors on Windows**
- Run PowerShell as Administrator if needed
- Check your PATH environment variable

**Still having issues?**
- Use `npx supabase` method - it always works
- Check official docs: https://github.com/supabase/cli#install-the-cli

