import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetString = "const userAddress = address || (user?.wallet?.address as `0x${string}`) || undefined;";
const replacementString = `const embeddedWallet = user?.linkedAccounts?.find((account: any) => account.type === 'wallet' && account.walletClientType === 'privy');
  const userAddress = address || (user?.wallet?.address as \`0x\${string}\`) || (embeddedWallet?.address as \`0x\${string}\`) || undefined;`;

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(targetString)) {
      content = content.replace(targetString, replacementString);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});

// For Navbar.tsx, it might have slightly different syntax:
// const userAddress = address || user?.wallet?.address;
walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('Navbar.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const navTarget = "const userAddress = address || user?.wallet?.address;";
    if (content.includes(navTarget)) {
      const navReplace = `const userAddress = address || user?.wallet?.address || (user?.linkedAccounts?.find((a: any) => a.type === 'wallet' && a.walletClientType === 'privy')?.address);`;
      content = content.replace(navTarget, navReplace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated Navbar:', filePath);
    }
  }
});
