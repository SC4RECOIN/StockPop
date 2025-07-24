export interface StocksResponse {
    pools: Pool[]
}

export interface Pool {
    id: string
    chain: string
    dex: string
    type: string
    quoteAsset: string
    createdAt: string
    liquidity?: number
    volume24h: number
    updatedAt: string
    baseAsset: BaseAsset
}

export interface BaseAsset {
    id: string
    name: string
    symbol: string
    icon: string
    description: string
    category: 'stock' | 'etf' | 'leveraged' | 'other',
    sector?: string
    industry?: string
    decimals: number
    dev: string
    circSupply: number
    totalSupply: number
    tokenProgram: string
    mintAuthority: string
    freezeAuthority: string
    firstPool: FirstPool
    holderCount: number
    audit: Audit
    stockData: StockData
    organicScore: number
    organicScoreLabel: string
    isVerified: boolean
    cexes?: string[]
    tags: string[]
    fdv: number
    mcap: number
    usdPrice: number
    priceBlockId: number
    liquidity: number
    stats5m?: Stats
    stats1h: Stats
    stats6h: Stats
    stats24h: Stats
    ctLikes?: number
    smartCtLikes?: number
}

export interface FirstPool {
    id: string
    createdAt: string
}

export interface Audit {
    topHoldersPercentage: number
    devBalancePercentage: number
    permanentControlEnabled: boolean
    highSingleOwnership: boolean
}

export interface StockData {
    price: number
    mcap: number
    updatedAt: string
}

export interface Stats {
    priceChange?: number
    holderChange?: number
    liquidityChange?: number
    volumeChange?: number
    buyVolume?: number
    sellVolume?: number
    buyOrganicVolume?: number
    sellOrganicVolume?: number
    numBuys?: number
    numSells?: number
    numTraders?: number
    numOrganicBuyers?: number
    numNetBuyers?: number
}
