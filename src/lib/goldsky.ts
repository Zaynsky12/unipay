import { GraphQLClient, gql } from 'graphql-request';

const GOLDSKY_ENDPOINT = process.env.NEXT_PUBLIC_GOLDSKY_URL || '';

export const goldskyClient = new GraphQLClient(GOLDSKY_ENDPOINT);

export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocol(id: "protocol") {
      id
      totalMerchants
      totalVolume
      totalTransactions
      updatedAt
    }
  }
`;

export const GET_ALL_MERCHANTS = gql`
  query GetAllMerchants($first: Int = 50, $skip: Int = 0, $orderBy: Merchant_orderBy = totalReceived, $orderDirection: OrderDirection = desc, $search: String = "") {
    merchants(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { name_contains_nocase: $search }
    ) {
      id
      name
      metadata
      totalReceived
      totalSessions
      active
    }
  }
`;

export const GET_MERCHANT = gql`
  query GetMerchant($id: ID!) {
    merchant(id: $id) {
      id
      name
      metadata
      totalReceived
      totalSessions
      registeredAt
      active
    }
  }
`;

export const GET_MERCHANT_HISTORY = gql`
  query GetMerchantHistory($merchantId: ID!) {
    merchant(id: $merchantId) {
      id
      name
      totalReceived
      sessions(orderBy: createdAt, orderDirection: desc) {
        id
        amount
        token
        description
        paid
        active
        createdAt
      }
      payments(orderBy: timestamp, orderDirection: desc) {
        id
        sessionId
        amount
        token
        payer
        timestamp
      }
      subscriptions(orderBy: createdAt, orderDirection: desc) {
        id
        sessionId
        subscriber
        amount
        token
        interval
        isActive
        createdAt
      }
    }
    subscriptionPayments(where: { merchant: $merchantId }, orderBy: timestamp, orderDirection: desc) {
      id
      subId
      amount
      subscriber
      timestamp
    }
  }
`;

export const GET_SESSION = gql`
  query GetSession($id: ID!) {
    paymentSession(id: $id) {
      id
      merchant {
        id
        name
      }
      amount
      token
      expiresAt
      paid
      payer
      description
      createdAt
      transaction {
        id
      }
    }
  }
`;

export const GET_BUYER_SUBSCRIPTIONS = gql`
  query GetBuyerSubscriptions($subscriber: String!) {
    subscriptionPlans(
      where: { subscriber_contains_nocase: $subscriber }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      merchant {
        id
        name
      }
      amount
      token
      interval
      isActive
      createdAt
    }
  }
`;

export const GET_ACTIVE_SUBSCRIPTIONS = gql`
  query GetActiveSubscriptions {
    subscriptionPlans(
      where: { isActive: true }
    ) {
      id
      subscriber
      merchant {
        name
      }
      amount
      token
      interval
    }
  }
`;

export const GET_CUSTOMER_HISTORY = gql`
  query GetCustomerHistory($customerId: String!) {
    transactions(where: { payer_contains_nocase: $customerId }, orderBy: timestamp, orderDirection: desc) {
      id
      sessionId
      merchant {
        id
        name
      }
      amount
      token
      payer
      timestamp
    }
    subscriptionPayments(where: { subscriber_contains_nocase: $customerId }, orderBy: timestamp, orderDirection: desc) {
      id
      subId
      merchant {
        id
        name
      }
      amount
      subscriber
      timestamp
    }
  }
`;
