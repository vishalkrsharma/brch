# brch

A simple Version Control System (VCS) built with Node.js and TypeScript.

## Description

`brch` is a lightweight version control system that provides essential VCS functionality including repository initialization, file staging, and configuration management. It stores objects using SHA1 hashing and maintains a staging index for tracking changes.

## Installation

```bash
# Install globally
npm install -g brch

# Or use locally
npm install
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

### Configuration

Manage repository or global configuration:

```bash
# Set local repository configuration
brch config set user.name "Your Name"
brch config set user.email "your.email@example.com"

# Set global configuration
brch config set --global user.name "Your Name"
```

Configuration is stored in `.brchconfig` (local) or `~/.brchconfig` (global) using INI format.

## Commands

- `brch init` - Initialize a new repository
- `brch add <paths...>` - Add files to the staging area
- `brch config set <scopeKey> <value>` - Set configuration value
  - `--global` - Set global configuration instead of local

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
