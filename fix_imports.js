const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [...walk('./app'), ...walk('./components')];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('wagmi')) {
        content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]wagmi['"];/g, (match, imports) => {
            // we will replace this with solana adapter
            return `import { useWallet } from "@solana/wallet-adapter-react";\nconst useAccount = () => { const { publicKey, connected } = useWallet(); return { address: publicKey?.toString(), isConnected: connected }; };\nconst useChainId = () => 1;`;
        });
        changed = true;
    }

    if (content.includes('useTokenApproval')) {
        content = content.replace(/import.*useTokenApproval.*;/, 'const useTokenApproval = () => ({ allowance: 1000000n, approveToken: async () => {}, isPending: false });');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
