#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


const config = {
    extensions: {
        react: ['.js', '.jsx', '.tsx', '.ts'],
        go: ['.go']
    },
    excludeDirs: ['node_modules', 'vendor', 'build', 'dist', '.git'],
    modifyInPlace: true 
};


try {
    console.log('Checking dependencies...');
    execSync('npm list strip-comments', { stdio: 'ignore' });
} catch (e) {
    console.log('Installing required dependencies...');
    execSync('npm install strip-comments', { stdio: 'inherit' });
}

const stripComments = require('strip-comments');


function removeJSComments(content) {
    return stripComments(content);
}


function removeGoComments(content) {
    
    let result = content.replace(/\/\/.*$/gm, '');

    // Remove block comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Clean up extra newlines from removed comments
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

    return result;
}


function processFile(filePath) {
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


function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            
            if (config.excludeDirs.includes(file)) {
                console.log(`Skipping excluded directory: ${filePath}`);
                return;
            }
            walkDir(filePath);
        } else {
            const ext = path.extname(file).toLowerCase();
            
            if ([...config.extensions.react, ...config.extensions.go].includes(ext)) {
                processFile(filePath);
            }
        }
    });
}


function main() {
    const args = process.argv.slice(2);

    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
    Comment Remover CLI

    Usage: 
      node remove-comments-cli.js [options] [directory]

    Options:
      --no-modify             Create backup files instead of modifying in-place
      --extensions=.js,.jsx   Specify React extensions (default: .js,.jsx,.tsx,.ts)
      --go-extensions=.go     Specify Go extensions (default: .go)
      --exclude=dir1,dir2     Specify directories to exclude
      --help, -h              Show this help message

    Examples:
      node remove-comments-cli.js                    # Process current directory
      node remove-comments-cli.js src                # Process src directory
      node remove-comments-cli.js --no-modify        # Create backups
    `);
        return;
    }

    
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
        } else if (!arg.startsWith('-')) {
            targetDir = arg;
        }
    });

    console.log('=== Comment Remover CLI ===');
    console.log(`Target directory: ${targetDir}`);
    console.log(`React extensions: ${config.extensions.react.join(', ')}`);
    console.log(`Go extensions: ${config.extensions.go.join(', ')}`);
    console.log(`Excluded directories: ${config.excludeDirs.join(', ')}`);
    console.log(`Mode: ${config.modifyInPlace ? 'Modify in-place' : 'Create backups'}`);
    console.log('=========================');

    
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Directory not found: ${targetDir}`);
        return;
    }

    console.log('Starting to remove comments...');
    walkDir(targetDir);
    console.log('Done!');
}

main();