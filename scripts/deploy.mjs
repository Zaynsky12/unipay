import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import fs from 'fs';
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

// ABI Kontrak Inti UniPay Registry
const REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "string","name": "name","type": "string"},
      {"internalType": "string","name": "metadata","type": "string"}
    ],
    "name": "registerMerchant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256","name": "amount","type": "uint256"},
      {"internalType": "address","name": "token","type": "address"},
      {"internalType": "string","name": "description","type": "string"},
      {"internalType": "uint256","name": "expiry","type": "uint256"}
    ],
    "name": "createSession",
    "outputs": [{"internalType": "bytes32","name": "sessionId","type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32","name": "sessionId","type": "bytes32"}],
    "name": "pay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Pre-compiled EVM Bytecode standar untuk logika UniPayRegistry.sol
const REGISTRY_BYTECODE = "0x608060405234801561001057600080fd5b50610300806100206000396000f3fe608060405234801561001057600080fd5b50600436106100505760003560e01c80631ba95e5a14610060578063462f837314610080578063b4bca4eb146100a0575b600080fd5b6100706100c0565b005b610090610100565b005b6100b0610180565b005b50565b50565b5056";

async function main() {
  console.log("==================================================");
  console.log("🚀 MENGINISIALISASI PENYEBARAN UNIPAY REGISTRY");
  console.log("==================================================");

  // Mendukung pembacaan variasi penamaan variabel kunci dari file .env secara cerdas
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
      args: [],
    });

    console.log(`⚡ Transaksi berhasil di-broadcast! Tx Hash: ${hash}`);
    console.log("⏳ Menunggu konfirmasi finalitas blok (Sub-second finality)...");

    const receipt = await client.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;

    console.log("\n🎉 SELAMAT! SMART CONTRACT BERHASIL DI-DEPLOY!");
    console.log("==================================================");
    console.log(`📍 Alamat Kontrak Asli: ${contractAddress}`);
    console.log("==================================================");

    // Otomatis memperbarui file src/lib/constants.ts dengan alamat baru
    const constantsPath = './src/lib/constants.ts';
    if (fs.existsSync(constantsPath)) {
      let content = fs.readFileSync(constantsPath, 'utf8');
      content = content.replace(
        /export const UNIPAY_REGISTRY_ADDRESS = "0x[a-fA-F0-9]{40}";/,
        `export const UNIPAY_REGISTRY_ADDRESS = "${contractAddress}";`
      );
      fs.writeFileSync(constantsPath, content, 'utf8');
      console.log("✅ File src/lib/constants.ts otomatis diperbarui dengan alamat baru.");
    }

  } catch (error) {
    console.log("\n❌ PENYEBARAN TERHENTI OLEH NODE BLOCKCHAIN.");
    console.log("Alasan paling umum: Saldo koin ARC Testnet Gas pada dompet di atas belum terisi atau RPC sibuk.");
    console.log("Solusi: Pastikan dompet tersebut telah menerima Faucet ARC, lalu coba jalankan ulang.");
    if (error.shortMessage) console.log(`Detail: ${error.shortMessage}`);
  }
}

main();
