#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
    extensions: {
        react: ['.js', '.jsx', '.tsx', '.ts'],
        go: ['.go']
    },
    excludeFiles: ['.d.ts'], // File extensions to exclude
    excludeDirs: ['node_modules', 'vendor', 'build', 'dist', '.git'],
    modifyInPlace: true // Set to false if you want to create backup files
};

// Install dependencies if not already installed
try {
    console.log('Checking dependencies...');
    execSync('npm list strip-comments', { stdio: 'ignore' });
} catch (e) {
    console.log('Installing required dependencies...');
    execSync('npm install strip-comments', { stdio: 'inherit' });
}

const stripComments = require('strip-comments');

// Function to remove comments from JavaScript/TypeScript files while preserving URLs
function removeJSComments(content) {
    // We'll use strip-comments with options to preserve URLs
    return stripComments(content, {
        preserveUrls: true
    });
}

// Function to remove comments from Go files while preserving URLs
function removeGoComments(content) {
    // First, protect URLs by temporarily replacing them
    const urlPlaceholders = [];
    let counter = 0;

    // Save URLs with regex pattern that detects URLs starting with http:// or https://
    const urlProtectedContent = content.replace(/(https?:\/\/[^\s"']+)/g, (match) => {
        const placeholder = `__URL_PLACEHOLDER_${counter}__`;
        urlPlaceholders.push({ placeholder, url: match });
        counter++;
        return placeholder;
    });

    // Now remove comments on the protected content
    // Remove line comments
    let result = urlProtectedContent.replace(/\/\/.*$/gm, '');

    // Remove block comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Clean up extra newlines from removed comments
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Restore URLs
    urlPlaceholders.forEach(({ placeholder, url }) => {
        result = result.replace(new RegExp(placeholder, 'g'), url);
    });

    return result;
}

// Function to check if file should be excluded
function shouldExcludeFile(filePath) {
    // Check if it's a declaration file (.d.ts)
    if (filePath.endsWith('.d.ts')) {
        return true;
    }

    // Check other excluded file patterns
    for (const pattern of config.excludeFiles) {
        if (filePath.endsWith(pattern)) {
            return true;
        }
    }

    return false;
}

// Function to process a file
function processFile(filePath) {
    // Check if file should be excluded
    if (shouldExcludeFile(filePath)) {
        console.log(`Skipping excluded file: ${filePath}`);
        return;
    }

    console.log(`Processing: ${filePath}`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        let processedContent;

        if (config.extensions.react.includes(ext)) {
            processedContent = removeJSComments(content);
        } else if (config.extensions.go.includes(ext)) {
            processedContent = removeGoComments(content);
        } else {
            console.log(`Skipping unsupported file type: ${filePath}`);
            return;
        }

        // Check if content was modified
        if (content !== processedContent) {
            if (config.modifyInPlace) {
                fs.writeFileSync(filePath, processedContent, 'utf8');
                console.log(`✅ Comments removed: ${filePath}`);
            } else {
                const backupPath = `${filePath}.backup`;
                fs.writeFileSync(backupPath, content, 'utf8');
                fs.writeFileSync(filePath, processedContent, 'utf8');
                console.log(`✅ Comments removed (backup created): ${filePath}`);
            }
        } else {
            console.log(`ℹ️ No comments found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
}

// Function to walk directories recursively
function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip excluded directories
            if (config.excludeDirs.includes(file)) {
                console.log(`Skipping excluded directory: ${filePath}`);
                return;
            }
            walkDir(filePath);
        } else {
            const ext = path.extname(file).toLowerCase();
            // Process only React and Go files
            if ([...config.extensions.react, ...config.extensions.go].includes(ext)) {
                processFile(filePath);
            }
        }
    });
}

// Main execution
function main() {
    const args = process.argv.slice(2);

    // Display help information if requested
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
    Comment Remover CLI

    Usage: 
      node remove-comments-cli.js [options] [directory]

    Options:
      --no-modify                Create backup files instead of modifying in-place
      --extensions=.js,.jsx      Specify React extensions (default: .js,.jsx,.tsx,.ts)
      --go-extensions=.go        Specify Go extensions (default: .go)
      --exclude=dir1,dir2        Specify directories to exclude
      --exclude-files=.d.ts      Specify file patterns to exclude
      --help, -h                 Show this help message

    Examples:
      node remove-comments-cli.js                    # Process current directory
      node remove-comments-cli.js src                # Process src directory
      node remove-comments-cli.js --no-modify        # Create backups
      node remove-comments-cli.js --exclude-files=.d.ts,.min.js
    `);
        return;
    }

    // Parse command line options
    let targetDir = process.cwd();

    args.forEach(arg => {
        if (arg.startsWith('--no-modify')) {
            config.modifyInPlace = false;
        } else if (arg.startsWith('--extensions=')) {
            config.extensions.react = arg.substring(13).split(',');
        } else if (arg.startsWith('--go-extensions=')) {
            config.extensions.go = arg.substring(16).split(',');
        } else if (arg.startsWith('--exclude=')) {
            config.excludeDirs = arg.substring(10).split(',');
        } else if (arg.startsWith('--exclude-files=')) {
            config.excludeFiles = arg.substring(16).split(',');
        } else if (!arg.startsWith('-')) {
            targetDir = arg;
        }
    });

    console.log('=== Comment Remover CLI ===');
    console.log(`Target directory: ${targetDir}`);
    console.log(`React extensions: ${config.extensions.react.join(', ')}`);
    console.log(`Go extensions: ${config.extensions.go.join(', ')}`);
    console.log(`Excluded directories: ${config.excludeDirs.join(', ')}`);
    console.log(`Excluded file patterns: ${config.excludeFiles.join(', ')}`);
    console.log(`Mode: ${config.modifyInPlace ? 'Modify in-place' : 'Create backups'}`);
    console.log('=========================');
    console.log(`Current Date and Time (UTC): ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`);
    console.log(`Current User: Rafael8313`);
    console.log('=========================');

    // Start processing
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Directory not found: ${targetDir}`);
        return;
    }

    console.log('Starting to remove comments...');
    walkDir(targetDir);
    console.log('Done!');
}

main();