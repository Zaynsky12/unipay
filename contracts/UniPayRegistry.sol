// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniPayRegistry
 * @dev Fully onchain decentralized payment checkout protocol for the Arc Network.
 * Acts as an immutable, stateless dispatch controller enabling P2P multi-chain settlement.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract UniPayRegistry {
    
    struct MerchantProfile {
        string name;
        string metadata;
        bool isRegistered;
        uint256 totalReceived;
        uint256 totalTransactions;
    }

    struct CheckoutSession {
        address merchant;
        uint256 amount;
        address token;
        uint256 expiry;
        bool isFulfilled;
    }

    // Mapping identitas merchant onchain
    mapping(address => MerchantProfile) public merchants;
    
    // Mapping state sesi checkout berdasarkan hash bytes32
    mapping(bytes32 => CheckoutSession) public sessions;

    // Events Logging untuk direfleksikan secara instan oleh Wagmi/Viem Listeners
    event MerchantRegistered(address indexed merchant, string name, string metadata);
    event SessionCreated(bytes32 indexed sessionId, address indexed merchant, uint256 amount, address token, uint256 expiry);
    event PaymentCompleted(bytes32 indexed sessionId, address indexed merchant, address indexed payer, uint256 amount);

    /**
     * @dev Mendaftarkan profil komersial pedagang secara terdesentralisasi onchain.
     * @param name Nama representasi merek dagang.
     * @param metadata Deskripsi atau spesifikasi spesifik Gateway.
     */
    function registerMerchant(string memory name, string memory metadata) external {
        require(bytes(name).length > 0, "Brand name cannot be empty");
        
        MerchantProfile storage profile = merchants[msg.sender];
        profile.name = name;
        profile.metadata = metadata;
        profile.isRegistered = true;

        emit MerchantRegistered(msg.sender, name, metadata);
    }

    /**
     * @dev Menerbitkan tautan sesi penagihan pintar dengan masa kedaluwarsa.
     * @param amount Jumlah unit token yang ditagihkan.
     * @param token Alamat kontrak token ERC20 (USDC/EURC).
     * @param description Keterangan spesifik pesanan.
     * @param expiry Timestamp detik absolut masa aktif tagihan.
     * @return sessionId Identifier unik berbasis hash kriptografis.
     */
    function createSession(
        uint256 amount, 
        address token, 
        string memory description, 
        uint256 expiry
    ) external returns (bytes32 sessionId) {
        require(amount > 0, "Requested settlement amount must be greater than zero");
        require(token != address(0), "Invalid stablecoin contract address");
        require(expiry > block.timestamp, "Session lifecycle expiry must be in the future");

        // Hash deterministik yang unik untuk mengidentifikasi endpoint pesanan
        sessionId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                description,
                expiry,
                block.timestamp
            )
        );

        require(sessions[sessionId].merchant == address(0), "Session collision detected");

        sessions[sessionId] = CheckoutSession({
            merchant: msg.sender,
            amount: amount,
            token: token,
            expiry: expiry,
            isFulfilled: false
        });

        emit SessionCreated(sessionId, msg.sender, amount, token, expiry);
    }

    /**
     * @dev Melunasi pesanan spesifik. Memotong saldo pembeli dan menyelesaikannya langsung ke dompet pedagang.
     * @param sessionId Hash identifier sesi pesanan yang ingin dibayar.
     */
    function pay(bytes32 sessionId) external {
        CheckoutSession storage session = sessions[sessionId];
        
        require(session.merchant != address(0), "Target payment dispatch session does not exist");
        require(!session.isFulfilled, "Payment session endpoint has already been fulfilled");
        require(block.timestamp <= session.expiry, "Payment dispatch session lifecycle has expired");

        // Tandai pesanan lunas sebelum transfer untuk mencegah serangan masuk ulang (Reentrancy)
        session.isFulfilled = true;

        address targetMerchant = session.merchant;
        uint256 targetAmount = session.amount;
        address targetToken = session.token;

        // Perbarui rekapitulasi statistik onchain pedagang
        merchants[targetMerchant].totalReceived += targetAmount;
        merchants[targetMerchant].totalTransactions += 1;

        // Eksekusi P2P Settlement langsung dari dompet Payer ke Merchant
        bool success = IERC20(targetToken).transferFrom(msg.sender, targetMerchant, targetAmount);
        require(success, "Cross-chain stablecoin transfer execution failed");

        emit PaymentCompleted(sessionId, targetMerchant, msg.sender, targetAmount);
    }
}
