import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  MerchantRegistered,
  SessionCreated,
  SessionDeactivated,
  PaymentCompleted,
  SubscriptionCreated,
  SubscriptionExecuted,
  SubscriptionCancelled
} from "../generated/LumiPayRegistry/LumiPayRegistry"
import {
  Merchant,
  PaymentSession,
  Transaction,
  Protocol,
  SubscriptionPlan,
  SubscriptionPayment
} from "../generated/schema"

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("protocol")
  if (!protocol) {
    protocol = new Protocol("protocol")
    protocol.totalMerchants = BigInt.fromI32(0)
    protocol.totalVolume = BigInt.fromI32(0)
    protocol.totalTransactions = BigInt.fromI32(0)
    protocol.updatedAt = BigInt.fromI32(0)
    protocol.save()
  }
  return protocol
}

export function handleMerchantRegistered(event: MerchantRegistered): void {
  let merchant = Merchant.load(event.params.merchant.toHexString())
  if (!merchant) {
    merchant = new Merchant(event.params.merchant.toHexString())
    merchant.totalReceived = BigInt.fromI32(0)
    merchant.totalSessions = BigInt.fromI32(0)
    merchant.registeredAt = event.block.timestamp
    merchant.active = true
    
    let protocol = getOrCreateProtocol()
    protocol.totalMerchants = protocol.totalMerchants.plus(BigInt.fromI32(1))
    protocol.updatedAt = event.block.timestamp
    protocol.save()
  }
  merchant.name = event.params.name
  merchant.metadata = event.params.metadata
  merchant.save()
}

export function handleSessionCreated(event: SessionCreated): void {
  let merchantId = event.params.merchant.toHexString()
  let merchant = Merchant.load(merchantId)
  
  if (!merchant) {
    merchant = new Merchant(merchantId)
    merchant.name = "Anonymous"
    merchant.metadata = ""
    merchant.totalReceived = BigInt.fromI32(0)
    merchant.totalSessions = BigInt.fromI32(0)
    merchant.registeredAt = event.block.timestamp
    merchant.active = true
    merchant.save()

    let protocol = getOrCreateProtocol()
    protocol.totalMerchants = protocol.totalMerchants.plus(BigInt.fromI32(1))
    protocol.save()
  }

  let session = new PaymentSession(event.params.sessionId.toHexString())
  session.merchant = merchantId
  session.amount = event.params.amount
  session.token = event.params.token.toHexString()
  session.expiresAt = event.params.expiry
  session.description = event.params.description
  session.paid = false
  session.active = true
  session.isReusable = event.params.isReusable
  session.createdAt = event.block.timestamp
  session.save()

  merchant.totalSessions = merchant.totalSessions.plus(BigInt.fromI32(1))
  merchant.save()
}

export function handleSessionDeactivated(event: SessionDeactivated): void {
  let session = PaymentSession.load(event.params.sessionId.toHexString())
  if (session) {
    session.active = false
    session.save()
  }
}

export function handlePaymentCompleted(event: PaymentCompleted): void {
  let session = PaymentSession.load(event.params.sessionId.toHexString())
  if (session) {
    if (!session.isReusable) {
      session.paid = true
    }
    session.payer = event.params.payer.toHexString()
    session.paidAt = event.block.timestamp
    session.save()
  }

  let transaction = new Transaction(event.transaction.hash.toHexString())
  transaction.sessionId = event.params.sessionId
  transaction.payer = event.params.payer.toHexString()
  transaction.merchant = event.params.merchant.toHexString()
  transaction.amount = event.params.amount
  transaction.token = session ? session.token : "0x"
  transaction.timestamp = event.block.timestamp
  transaction.blockNumber = event.block.number
  transaction.save()

  if (session) {
    session.transaction = transaction.id
    session.save()
  }

  let merchant = Merchant.load(event.params.merchant.toHexString())
  if (merchant) {
    merchant.totalReceived = merchant.totalReceived.plus(event.params.amount)
    merchant.save()
  }

  let protocol = getOrCreateProtocol()
  protocol.totalVolume = protocol.totalVolume.plus(event.params.amount)
  protocol.totalTransactions = protocol.totalTransactions.plus(BigInt.fromI32(1))
  protocol.updatedAt = event.block.timestamp
  protocol.save()
}

export function handleSubscriptionCreated(event: SubscriptionCreated): void {
  let plan = new SubscriptionPlan(event.params.subId.toHexString())
  plan.merchant = event.params.merchant.toHexString()
  plan.subscriber = event.params.subscriber.toHexString()
  plan.amount = event.params.amount
  plan.interval = event.params.interval
  plan.sessionId = event.params.sessionId
  plan.isActive = true
  plan.createdAt = event.block.timestamp
  plan.token = "0x3600000000000000000000000000000000000000" // Defaulting to USDC since token is not in this event
  plan.save()
}

export function handleSubscriptionExecuted(event: SubscriptionExecuted): void {
  let payment = new SubscriptionPayment(event.transaction.hash.toHexString())
  payment.subId = event.params.subId
  payment.merchant = event.params.merchant.toHexString()
  payment.subscriber = event.params.subscriber.toHexString()
  payment.amount = event.params.amount
  payment.timestamp = event.block.timestamp
  payment.save()

  let merchant = Merchant.load(event.params.merchant.toHexString())
  if (merchant) {
    merchant.totalReceived = merchant.totalReceived.plus(event.params.amount)
    merchant.save()
  }

  let protocol = getOrCreateProtocol()
  protocol.totalVolume = protocol.totalVolume.plus(event.params.amount)
  protocol.totalTransactions = protocol.totalTransactions.plus(BigInt.fromI32(1))
  protocol.updatedAt = event.block.timestamp
  protocol.save()
}

export function handleSubscriptionCancelled(event: SubscriptionCancelled): void {
  let plan = SubscriptionPlan.load(event.params.subId.toHexString())
  if (plan) {
    plan.isActive = false
    plan.save()
  }
}
