import { GraphQLClient, gql } from 'graphql-request';

const GOLDSKY_ENDPOINT = 'https://api.goldsky.com/api/public/project_cmp4c9mq1fr6t01y5emhw79h2/subgraphs/lumipay/v3/gn';

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
        subscriber
        amount
        interval
        isActive
        createdAt
      }
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
