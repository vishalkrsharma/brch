# brch

A simple Version Control System (VCS) built with TypeScript.

## Description

`brch` is a lightweight version control system that provides essential VCS functionality including repository initialization, file staging, commits, history tracking, and diff visualization. It stores objects using SHA1 hashing and maintains a staging index for tracking changes.

## Installation

Install globally via npm:

```bash
npm install -g brch
```

Or use with npx without installing:

```bash
npx brch <command>
```

## Usage

### Initialize a Repository

Initialize a new `brch` repository in the current directory:

```bash
brch init
```

This creates a `.brch` directory with the necessary structure for version control.

### Add Files to Staging

Add files or directories to the staging area:

```bash
# Add specific files
brch add file1.txt file2.js

# Add entire directory
brch add src/

# Add current directory
brch add .
```

The command will:

- Stage new or modified files
- Skip unchanged files
- Store file objects in `.brch/objects/` using SHA1 hashing
- Update the staging index

### Commit Changes

Commit staged changes to the repository:

```bash
# Commit with a message
brch commit -m "Add new feature"

# Commit with a longer message
brch commit -m "Fix bug in authentication" -m "Updated login validation logic"
```

### View Status

Check the status of your working directory:

```bash
brch status
```

This shows:

- Changes staged for commit
- Modified files not yet staged
- Untracked files and directories

### View Commit History

View the commit history of the current branch:

```bash
brch log
```

Displays commits with:

- Commit hash
- Author information
- Timestamp
- Commit message

### View Changes

See differences between your working directory and the last commit:

```bash
brch diff
```

Shows a colored unified diff of all modified files.

### Configuration

Manage repository or global configuration:

```bash
# Set local repository configuration
brch config set user.name "Your Name"
brch config set user.email "your.email@example.com"

# Set global configuration
brch config set --global user.name "Your Name"
brch config set --global user.email "your.email@example.com"
```

Configuration is stored in `.brchconfig` (local) or `~/.brchconfig` (global) using INI format.

## Commands

- `brch init` - Initialize a new repository
- `brch add <paths...>` - Add files to the staging area
- `brch commit -m <message>` - Commit staged changes
- `brch status` - Show the working tree status
- `brch log` - Show commit history
- `brch diff` - Show changes between working directory and last commit
- `brch config set <scopeKey> <value>` - Set configuration value
  - `--global` - Set global configuration instead of local

## Ignore Files

Create a `.brchignore` file in your repository root to exclude files and directories from version control:

```
# Example .brchignore
node_modules/
*.log
dist/
.env
```

Supports patterns:

- Exact matches: `node_modules`
- Glob patterns: `*.log`
- Directory patterns: `dist/`

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (latest version)
- npm (comes with Node.js)

### Build

```bash
# Build the project
npm run build

# Generate TypeScript types
npm run types
```

### Development

```bash
# Run in development mode
npm run dev
```

## Project Structure

```
brch/
├── src/
│   ├── commands/      # CLI command definitions
│   ├── services/      # Core business logic
│   └── utils/         # Utility functions and constants
├── dist/              # Compiled output
└── package.json
```

## License

MIT

## Author

vishalkrsharma
