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

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract UniPayRegistry is ERC2771Context {
    
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

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
        bool isActive;
    }

    // Mapping identitas merchant onchain
    mapping(address => MerchantProfile) public merchants;
    
    struct Subscription {
        address merchant;
        address subscriber;
        uint256 amount;
        address token;
        uint256 interval;
        uint256 nextPaymentDue;
        bool isActive;
    }

    // Mapping state sesi checkout berdasarkan hash bytes32
    mapping(bytes32 => CheckoutSession) public sessions;
    
    // Mapping state subscriptions
    mapping(bytes32 => Subscription) public subscriptions;

    // Events Logging untuk direfleksikan secara instan oleh Wagmi/Viem Listeners
    event MerchantRegistered(address indexed merchant, string name, string metadata);
    event SessionCreated(bytes32 indexed sessionId, address indexed merchant, uint256 amount, address token, string description, uint256 expiry);
    event SessionDeactivated(bytes32 indexed sessionId);
    event PaymentCompleted(bytes32 indexed sessionId, address indexed merchant, address indexed payer, uint256 amount);
    event SubscriptionCreated(bytes32 indexed subId, address indexed merchant, address indexed subscriber, uint256 amount, uint256 interval);
    event SubscriptionExecuted(bytes32 indexed subId, address indexed merchant, address indexed subscriber, uint256 amount);
    event SubscriptionCancelled(bytes32 indexed subId);

    /**
     * @dev Mendaftarkan profil komersial pedagang secara terdesentralisasi onchain.
     * @param name Nama representasi merek dagang.
     * @param metadata Deskripsi atau spesifikasi spesifik Gateway.
     */
    function registerMerchant(string memory name, string memory metadata) external {
        require(bytes(name).length > 0, "Brand name cannot be empty");
        
        MerchantProfile storage profile = merchants[_msgSender()];
        profile.name = name;
        profile.metadata = metadata;
        profile.isRegistered = true;

        emit MerchantRegistered(_msgSender(), name, metadata);
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
                _msgSender(),
                token,
                amount,
                description,
                expiry,
                block.timestamp
            )
        );

        require(sessions[sessionId].merchant == address(0), "Session collision detected");

        sessions[sessionId] = CheckoutSession({
            merchant: _msgSender(),
            amount: amount,
            token: token,
            expiry: expiry,
            isFulfilled: false,
            isActive: true
        });

        emit SessionCreated(sessionId, _msgSender(), amount, token, description, expiry);
    }

    /**
     * @dev Menonaktifkan sesi pembayaran secara on-chain.
     * @param sessionId Hash identifier sesi pesanan yang ingin dinonaktifkan.
     */
    function deactivateSession(bytes32 sessionId) external {
        require(sessions[sessionId].merchant == _msgSender(), "Only the merchant can deactivate this session");
        require(sessions[sessionId].isActive, "Session is already inactive");
        
        sessions[sessionId].isActive = false;
        emit SessionDeactivated(sessionId);
    }

    /**
     * @dev Melunasi pesanan spesifik. Memotong saldo pembeli dan menyelesaikannya langsung ke dompet pedagang.
     * @param sessionId Hash identifier sesi pesanan yang ingin dibayar.
     */
    function pay(bytes32 sessionId) external {
        CheckoutSession storage session = sessions[sessionId];
        
        require(session.merchant != address(0), "Target payment dispatch session does not exist");
        require(session.isActive, "Payment session has been deactivated by the merchant");
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
        address actualPayer = _msgSender();
        bool success = IERC20(targetToken).transferFrom(actualPayer, targetMerchant, targetAmount);
        require(success, "Cross-chain stablecoin transfer execution failed");

        emit PaymentCompleted(sessionId, targetMerchant, actualPayer, targetAmount);
    }

    /**
     * @dev Membuat langganan baru (Payer memanggil ini ke merchant tertentu).
     */
    function createSubscription(
        address targetMerchant,
        uint256 amount,
        address token,
        uint256 interval
    ) external returns (bytes32 subId) {
        require(amount > 0, "Amount must be greater than zero");
        require(token != address(0), "Invalid token");
        require(interval >= 1 days, "Interval too short");

        address subscriber = _msgSender();

        subId = keccak256(
            abi.encodePacked(
                targetMerchant,
                subscriber,
                token,
                amount,
                interval,
                block.timestamp
            )
        );

        subscriptions[subId] = Subscription({
            merchant: targetMerchant,
            subscriber: subscriber,
            amount: amount,
            token: token,
            interval: interval,
            nextPaymentDue: block.timestamp + interval, // Penarikan pertama bulan depan
            isActive: true
        });

        emit SubscriptionCreated(subId, targetMerchant, subscriber, amount, interval);
    }

    /**
     * @dev Eksekusi langganan secara otomatis (Bisa dipanggil oleh siapa saja / Cron Job / Relayer).
     */
    function executeSubscription(bytes32 subId) external {
        Subscription storage sub = subscriptions[subId];
        require(sub.isActive, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentDue, "Payment is not due yet");

        sub.nextPaymentDue = block.timestamp + sub.interval;

        address targetMerchant = sub.merchant;
        uint256 targetAmount = sub.amount;

        merchants[targetMerchant].totalReceived += targetAmount;
        merchants[targetMerchant].totalTransactions += 1;

        bool success = IERC20(sub.token).transferFrom(sub.subscriber, targetMerchant, targetAmount);
        require(success, "Subscription pull failed. Check allowance/balance.");

        emit SubscriptionExecuted(subId, targetMerchant, sub.subscriber, targetAmount);
    }

    /**
     * @dev Membatalkan langganan.
     */
    function cancelSubscription(bytes32 subId) external {
        Subscription storage sub = subscriptions[subId];
        require(sub.isActive, "Already inactive");
        require(_msgSender() == sub.subscriber || _msgSender() == sub.merchant, "Unauthorized");

        sub.isActive = false;
        emit SubscriptionCancelled(subId);
    }
}
