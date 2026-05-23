import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Definisi Jaringan Arc Testnet
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc Testnet Gas',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

async function main() {
  console.log("==================================================");
  console.log("🚀 MENGINISIALISASI PENYEBARAN UNIPAY REGISTRY RIIL");
  console.log("==================================================");

  // 1. Membaca Artifact Segar Hasil Kompilasi Hardhat Aktual
  const artifactPath = path.resolve('./artifacts/contracts/LumiPayRegistry.sol/LumiPayRegistry.json');
  
  if (!fs.existsSync(artifactPath)) {
    console.log("❌ Galat Kritis: Artifact Smart Contract belum ditemukan!");
    console.log("Silakan jalankan perintah kompilasi terlebih dahulu di terminal Anda:");
    console.log("👉 npx hardhat compile\n");
    process.exit(1);
  }

  console.log("📦 Membaca ABI dan Bytecode segar dari Hardhat Artifacts...");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const REGISTRY_ABI = artifact.abi;
  const REGISTRY_BYTECODE = artifact.bytecode;

  // 2. Menyiapkan Kunci Pribadi
  let pKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!pKey) {
    console.log("⚠️  Peringatan: Kunci pribadi tidak ditemukan di file .env");
    console.log("Membuat Akun Burner/Uji Coba Otomatis untuk simulasi lingkungan lokal...");
    
    const randomBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
    const randomHex = randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    pKey = `0x${randomHex}`;
    
    console.log(`🔑 Private Key Sementara: ${pKey.slice(0, 10)}...${pKey.slice(-6)}`);
    console.log("Simpan di .env Anda jika ingin mendanainya dengan Arc Testnet Faucet kelak.\n");
  } else if (!pKey.startsWith('0x')) {
    pKey = `0x${pKey}`;
  }

  try {
    const account = privateKeyToAccount(pKey);
    console.log(`🔌 Terhubung menggunakan Kunci Pribadi Anda.`);
    console.log(`📍 Alamat Dompet Pengirim: ${account.address}`);

    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    }).extend(publicActions);

    console.log("⏳ Mengirim transaksi penyebaran (Deployment) ke Arc Testnet Node...");
    
    const hash = await client.deployContract({
      abi: REGISTRY_ABI,
      bytecode: REGISTRY_BYTECODE,
      args: ['0x0000000000000000000000000000000000000000'], // Trusted Forwarder for Meta-transactions
    });

    console.log(`⚡ Transaksi berhasil di-broadcast! Tx Hash: ${hash}`);
    console.log("⏳ Menunggu konfirmasi finalitas blok (Sub-second finality)...");

    const receipt = await client.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;

    console.log("\n🎉 SELAMAT! SMART CONTRACT RIIL BERHASIL DI-DEPLOY!");
    console.log("==================================================");
    console.log(`📍 Alamat Kontrak Segar: ${contractAddress}`);
    console.log("==================================================");

    // 3. Otomatis memperbarui file src/lib/constants.ts dengan alamat baru secara presisi
    const constantsPath = path.resolve('./src/lib/constants.ts');
    if (fs.existsSync(constantsPath)) {
      let content = fs.readFileSync(constantsPath, 'utf8');
      
      // Menimpa alamat lama dengan aman dan presisi
      content = content.replace(
        /export const LUMIPAY_REGISTRY_ADDRESS = "0x[a-fA-F0-9]{40}".*/,
        `export const LUMIPAY_REGISTRY_ADDRESS = "${contractAddress}" as \`0x\${string}\`;`
      );
      
      fs.writeFileSync(constantsPath, content, 'utf8');
      console.log("✅ File src/lib/constants.ts otomatis diperbarui dengan alamat kontrak baru yang sah.");
    }

    // 4. Otomatis memperbarui subgraph.yaml (mengganti/menghapus pendengaran kontrak lama)
    const subgraphPath = path.resolve('./subgraph/subgraph.yaml');
    if (fs.existsSync(subgraphPath)) {
      let subContent = fs.readFileSync(subgraphPath, 'utf8');
      subContent = subContent.replace(
        /address: "0x[a-fA-F0-9]{40}"/,
        `address: "${contractAddress.toLowerCase()}"`
      );
      fs.writeFileSync(subgraphPath, subContent, 'utf8');
      console.log("✅ File subgraph/subgraph.yaml otomatis diperbarui ke alamat kontrak baru (memutuskan kontrak lama).");
    }

  } catch (error) {
    console.log("\n❌ PENYEBARAN TERHENTI OLEH NODE BLOCKCHAIN.");
    console.log("Alasan paling umum: Saldo koin ARC Testnet Gas pada dompet di atas belum terisi atau RPC sibuk.");
    console.log("Solusi: Pastikan dompet tersebut telah menerima Faucet ARC, lalu coba jalankan ulang.");
    if (error.shortMessage) console.log(`Detail: ${error.shortMessage}`);
  }
}

main();
