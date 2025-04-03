#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


const now = new Date();
const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
const currentUser = 'Rafael8313';


const config = {
    extensions: {
        react: ['.js', '.jsx', '.tsx', '.ts'],
        go: ['.go']
    },
    excludeFiles: ['.d.ts','.gen.ts'],
    excludeDirs: ['node_modules', 'vendor', 'build', 'dist', '.git'],
    preserveDocComments: true, 
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


function preserveJSDocComments(content) {
    
    const jsdocComments = [];
    let counter = 0;

    
    const contentWithoutJSDoc = content.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
        const placeholder = `__JSDOC_PLACEHOLDER_${counter}__`;
        jsdocComments.push({ placeholder, comment: match });
        counter++;
        return placeholder;
    });

    
    const withoutComments = stripComments(contentWithoutJSDoc, {
        preserveUrls: true
    });

    
    let result = withoutComments;
    jsdocComments.forEach(({ placeholder, comment }) => {
        result = result.replace(placeholder, comment);
    });

    return result;
}


function removeJSComments(content) {
    if (config.preserveDocComments) {
        return preserveJSDocComments(content);
    } else {
        
        return stripComments(content, {
            preserveUrls: true
        });
    }
}


function removeGoComments(content) {
    
    const urlPlaceholders = [];
    let counter = 0;

    
    const urlProtectedContent = content.replace(/(https?:\/\/[^\s"']+)/g, (match) => {
        const placeholder = `__URL_PLACEHOLDER_${counter}__`;
        urlPlaceholders.push({ placeholder, url: match });
        counter++;
        return placeholder;
    });

    // If preserving doc comments, replace them with placeholders too
    const docComments = [];
    let docCounter = 0;
    let contentToProcess = urlProtectedContent;

    if (config.preserveDocComments) {
        contentToProcess = urlProtectedContent.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
            const placeholder = `__GODOC_PLACEHOLDER_${docCounter}__`;
            docComments.push({ placeholder, comment: match });
            docCounter++;
            return placeholder;
        });
    }

    // Now remove regular comments
    // Remove line comments
    let result = contentToProcess.replace(/\/\/.*$/gm, '');

    // Remove block comments, but not doc comments which were already replaced
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Clean up extra newlines from removed comments
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

    
    if (config.preserveDocComments) {
        docComments.forEach(({ placeholder, comment }) => {
            result = result.replace(new RegExp(placeholder, 'g'), comment);
        });
    }

    
    urlPlaceholders.forEach(({ placeholder, url }) => {
        result = result.replace(new RegExp(placeholder, 'g'), url);
    });

    return result;
}


function shouldExcludeFile(filePath) {
    
    if (filePath.endsWith('.d.ts')) {
        return true;
    }

    
    for (const pattern of config.excludeFiles) {
        if (filePath.endsWith(pattern)) {
            return true;
        }
    }

    return false;
}


function processFile(filePath) {
    
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
            console.log(`ℹ️ No comments found or all comments preserved: ${filePath}`);
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
      --no-modify                Create backup files instead of modifying in-place
      --extensions=.js,.jsx      Specify React extensions (default: .js,.jsx,.tsx,.ts)
      --go-extensions=.go        Specify Go extensions (default: .go)
      --exclude=dir1,dir2        Specify directories to exclude
      --exclude-files=.d.ts      Specify file patterns to exclude
      --remove-doc-comments      Remove JSDoc comments (/**...*/) as well
      --help, -h                 Show this help message

    Examples:
      node remove-comments-cli.js                    # Process current directory
      node remove-comments-cli.js src                # Process src directory
      node remove-comments-cli.js --no-modify        # Create backups
      node remove-comments-cli.js --exclude-files=.d.ts,.min.js
      node remove-comments-cli.js --remove-doc-comments  # Remove all comments
    `);
        return;
    }

    
    let targetDir = process.cwd();

    args.forEach(arg => {
        if (arg.startsWith('--no-modify')) {
            config.modifyInPlace = false;
        } else if (arg.startsWith('--remove-doc-comments')) {
            config.preserveDocComments = false;
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
    console.log(`Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): ${formattedDate}`);
    console.log(`Current User's Login: ${currentUser}`);
    console.log('=========================');
    console.log(`Target directory: ${targetDir}`);
    console.log(`React extensions: ${config.extensions.react.join(', ')}`);
    console.log(`Go extensions: ${config.extensions.go.join(', ')}`);
    console.log(`Excluded directories: ${config.excludeDirs.join(', ')}`);
    console.log(`Excluded file patterns: ${config.excludeFiles.join(', ')}`);
    console.log(`Preserve JSDoc comments: ${config.preserveDocComments ? 'Yes' : 'No'}`);
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