#!/usr/bin/env node
/**
 * Devlog Entry Script
 * Usage: node scripts/devlog.js <type> <message>
 * Types: add | fix | rem | upd
 * 
 * Examples:
 *   node scripts/devlog.js add "Implemented new weapon system"
 *   node scripts/devlog.js fix "Fixed enemy spawn rate bug"
 *   node scripts/devlog.js rem "Removed deprecated test page"
 *   node scripts/devlog.js upd "Updated damage values for dagger"
 */

const fs = require("fs");
const path = require("path");

const DEVLOG_PATH = path.resolve(process.cwd(), "devlog.txt");

const TYPE_MAP = {
    add: "ADD",
    fix: "FIX",
    rem: "REM",
    upd: "UPD",
    addition: "ADD",
    removal: "REM",
    update: "UPD",
};

function getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDevlogEntry(type, message) {
    const normalizedType = TYPE_MAP[type.toLowerCase()];
    
    if (!normalizedType) {
        console.error(`❌ Invalid type: "${type}"`);
        console.error(`   Valid types: add, fix, rem, upd`);
        process.exit(1);
    }

    if (!message || message.trim().length === 0) {
        console.error(`❌ Message cannot be empty`);
        process.exit(1);
    }

    const dateStr = getDateString();
    const entry = `[${dateStr}] [${normalizedType}] ${message.trim()}`;

    // Read existing content
    let content = "";
    if (fs.existsSync(DEVLOG_PATH)) {
        content = fs.readFileSync(DEVLOG_PATH, "utf-8");
    } else {
        // Create new devlog with header
        content = `# Slavic Survivors Development Log
# Format: [YYYY-MM-DD] [TYPE] Description
# Types: ADD (addition), FIX (bug fix), REM (removal), UPD (update)
# ═══════════════════════════════════════════════════════════════════════════

`;
    }

    // Append the new entry
    const updatedContent = content.trimEnd() + "\n" + entry + "\n";
    fs.writeFileSync(DEVLOG_PATH, updatedContent, "utf-8");

    console.log(`✅ Devlog entry added:`);
    console.log(`   ${entry}`);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(`
📝 Slavic Survivors Devlog CLI

Usage: node scripts/devlog.js <type> <message>

Types:
  add  - New feature or addition
  fix  - Bug fix
  rem  - Removal of feature/code
  upd  - Update to existing feature

Examples:
  node scripts/devlog.js add "Implemented nuclear pigeon companion"
  node scripts/devlog.js fix "Fixed XP gem collection radius"
  node scripts/devlog.js rem "Removed test mint page"
  node scripts/devlog.js upd "Increased dagger damage from 15 to 18"
`);
    process.exit(0);
}

const [type, ...messageParts] = args;
const message = messageParts.join(" ");

addDevlogEntry(type, message);
