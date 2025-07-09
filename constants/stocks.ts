enum Category {
    Stock = "Stock",
    ETF = "ETF",
}

type Stock = {
    ticker: string;
    name: string;
    mint: string;
    image: string;
    category?: Category;
    description?: string;
}

// https://xstocks.com/products
export const stocks: Stock[] = [
    {
        ticker: "ABTx",
        name: "Abbott",
        mint: "XsHtf5RpxsQ7jeJ9ivNewouZKJHbPxhPoEy6yYvULr7",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684bf6359f8fa1d916afe97b_Ticker%3DABT%2C%20Company%20Name%3DAbbot%2C%20size%3D256x256.svg"
    },
    {
        ticker: "ABBVx",
        name: "AbbVie",
        mint: "XswbinNKyPmzTa5CskMbCPvMW6G5CMnZXZEeQSSQoie",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684be7c58986cdaeeee5bbba_Ticker%3DABBV%2C%20Company%20Name%3DSP500%2C%20size%3D256x256.svg"
    },
    {
        ticker: "ACNx",
        name: "Accenture",
        mint: "Xs5UJzmCRQ8DWZjskExdSQDnbE6iLkRu2jjrRAB1JSU",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684c0b0e15af8be8257db52f_Ticker%3DACN%2C%20Company%20Name%3Daccenture%2C%20size%3D256x256.svg"
    },
    {
        ticker: "GOOGLx",
        name: "Alphabet",
        mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684aae04a3d8452e0ae4bad8_Ticker%3DGOOG%2C%20Company%20Name%3DAlphabet%20Inc.%2C%20size%3D256x256.svg"
    },
    {
        ticker: "AMZNx",
        name: "Amazon",
        mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
        image: ""
    },
    {
        ticker: "AMBRx",
        name: "Amber",
        mint: "XsaQTCgebC2KPbf27KUhdv5JFvHhQ4GDAPURwrEhAzbb",
        image: ""
    },
    {
        ticker: "AAPLx",
        name: "Apple",
        mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        image: ""
    },
    {
        ticker: "APPx",
        name: "AppLovin",
        mint: "XsPdAVBi8Zc1xvv53k4JcMrQaEDTgkGqKYeh7AYgPHV",
        image: ""
    },
    {
        ticker: "AZNx",
        name: "AstraZeneca",
        mint: "Xs3ZFkPYT2BN7qBMqf1j1bfTeTm1rFzEFSsQ1z3wAKU",
        image: ""
    },
    {
        ticker: "BACx",
        name: "Bank of America",
        mint: "XswsQk4duEQmCbGzfqUUWYmi7pV7xpJ9eEmLHXCaEQP",
        image: ""
    },
    {
        ticker: "BRK.Bx",
        name: "Berkshire Hathaway",
        mint: "Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x",
        image: ""
    },
    {
        ticker: "AVGOx",
        name: "Broadcom",
        mint: "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo",
        image: ""
    },
    {
        ticker: "CVXx",
        name: "Chevron",
        mint: "XsNNMt7WTNA2sV3jrb1NNfNgapxRF5i4i6GcnTRRHts",
        image: ""
    },
    {
        ticker: "CRCLx",
        name: "Circle",
        mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1",
        image: ""
    },
    {
        ticker: "CSCOx",
        name: "Cisco",
        mint: "Xsr3pdLQyXvDJBFgpR5nexCEZwXvigb8wbPYp4YoNFf",
        image: ""
    },
    {
        ticker: "KOx",
        name: "Coca-Cola",
        mint: "XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ",
        image: ""
    },
    {
        ticker: "COINx",
        name: "Coinbase",
        mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
        image: ""
    },
    {
        ticker: "CMCSAx",
        name: "Comcast",
        mint: "XsvKCaNsxg2GN8jjUmq71qukMJr7Q1c5R2Mk9P8kcS8",
        image: ""
    },
    {
        ticker: "CRWDx",
        name: "CrowdStrike",
        mint: "Xs7xXqkcK7K8urEqGg52SECi79dRp2cEKKuYjUePYDw",
        image: ""
    },
    {
        ticker: "DHRx",
        name: "Danaher",
        mint: "Xseo8tgCZfkHxWS9xbFYeKFyMSbWEvZGFV1Gh53GtCV",
        image: ""
    },
    {
        ticker: "DFDVx",
        name: "DFDV",
        mint: "Xs2yquAgsHByNzx68WJC55WHjHBvG9JsMB7CWjTLyPy",
        image: ""
    },
    {
        ticker: "LLYx",
        name: "Eli Lilly",
        mint: "Xsnuv4omNoHozR6EEW5mXkw8Nrny5rB3jVfLqi6gKMH",
        image: ""
    },
    {
        ticker: "XOMx",
        name: "Exxon Mobil",
        mint: "XsaHND8sHyfMfsWPj6kSdd5VwvCayZvjYgKmmcNL5qhh",
        image: ""
    },
    {
        ticker: "GMEx",
        name: "Gamestop",
        mint: "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc",
        image: ""
    },
    {
        ticker: "GLDx",
        name: "Gold",
        mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re",
        image: ""
    },
    {
        ticker: "GSx",
        name: "Goldman Sachs",
        mint: "XsgaUyp4jd1fNBCxgtTKkW64xnnhQcvgaxzsbAq5ZD1",
        image: ""
    },
    {
        ticker: "HDx",
        name: "Home Depot",
        mint: "XszjVtyhowGjSC5odCqBpW1CtXXwXjYokymrk7fGKD3",
        image: ""
    },
    {
        ticker: "HONx",
        name: "Honeywell",
        mint: "XsRbLZthfABAPAfumWNEJhPyiKDW6TvDVeAeW7oKqA2",
        image: ""
    },
    {
        ticker: "INTCx",
        name: "Intel",
        mint: "XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM",
        image: ""
    },
    {
        ticker: "IBMx",
        name: "International Business Machinesock",
        mint: "XspwhyYPdWVM8XBHZnpS9hgyag9MKjLRyE3tVfmCbSr",
        image: ""
    },
    {
        ticker: "JNJx",
        name: "Johnson & Johnson",
        mint: "XsGVi5eo1Dh2zUpic4qACcjuWGjNv8GCt3dm5XcX6Dn",
        image: ""
    },
    {
        ticker: "JPMx",
        name: "JPMorgan Chase",
        mint: "XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C",
        image: ""
    },
    {
        ticker: "LINx",
        name: "Linde",
        mint: "XsSr8anD1hkvNMu8XQiVcmiaTP7XGvYu7Q58LdmtE8Z",
        image: ""
    },
    {
        ticker: "MRVLx",
        name: "Marvell",
        mint: "XsuxRGDzbLjnJ72v74b7p9VY6N66uYgTCyfwwRjVCJA",
        image: ""
    },
    {
        ticker: "MAx",
        name: "Mastercard",
        mint: "XsApJFV9MAktqnAc6jqzsHVujxkGm9xcSUffaBoYLKC",
        image: ""
    },
    {
        ticker: "MCDx",
        name: "McDonald's",
        mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2",
        image: ""
    },
    {
        ticker: "MDTx",
        name: "Medtronic",
        mint: "XsDgw22qRLTv5Uwuzn6T63cW69exG41T6gwQhEK22u2",
        image: ""
    },
    {
        ticker: "MRKx",
        name: "Merck",
        mint: "XsnQnU7AdbRZYe2akqqpibDdXjkieGFfSkbkjX1Sd1X",
        image: ""
    },
    {
        ticker: "METAx",
        name: "Meta",
        mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
        image: ""
    },
    {
        ticker: "MSFTx",
        name: "Microsoft",
        mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
        image: ""
    },
    {
        ticker: "MSTRx",
        name: "MicroStrategy",
        mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
        image: ""
    },
    {
        ticker: "QQQx",
        name: "Nasdaq",
        mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
        category: Category.ETF,
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/68511cb6e367f19f06664527_QQQx.svg",
        description: "Invesco QQQ Trust (QQQ) is an exchange-traded fund that aims to track the performance of the Nasdaq-100 Index, which includes 100 of the largest non-financial companies listed on the Nasdaq Stock Market. It offers concentrated exposure to major technology and growth-oriented companies."
    },
    {
        ticker: "NFLXx",
        name: "Netflix",
        mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL",
        image: ""
    },
    {
        ticker: "NVOx",
        name: "Novo Nordisk",
        mint: "XsfAzPzYrYjd4Dpa9BU3cusBsvWfVB9gBcyGC87S57n",
        image: ""
    },
    {
        ticker: "NVDAx",
        name: "NVIDIA",
        mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
        image: ""
    },
    {
        ticker: "ORCLx",
        name: "Oracle",
        mint: "XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL",
        image: ""
    },
    {
        ticker: "PLTRx",
        name: "Palantir",
        mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4",
        image: ""
    },
    {
        ticker: "PEPx",
        name: "PepsiCo",
        mint: "Xsv99frTRUeornyvCfvhnDesQDWuvns1M852Pez91vF",
        image: ""
    },
    {
        ticker: "PFEx",
        name: "Pfizer",
        mint: "XsAtbqkAP1HJxy7hFDeq7ok6yM43DQ9mQ1Rh861X8rw",
        image: ""
    },
    {
        ticker: "PMx",
        name: "Philip Morris",
        mint: "Xsba6tUnSjDae2VcopDB6FGGDaxRrewFCDa5hKn5vT3",
        image: ""
    },
    {
        ticker: "PGx",
        name: "Procter & Gamble",
        mint: "XsYdjDjNUygZ7yGKfQaB6TxLh2gC6RRjzLtLAGJrhzV",
        image: ""
    },
    {
        ticker: "HOODx",
        name: "Robinhood",
        mint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684c0f39cede10b9afa4852f_Ticker%3DHOOD%2C%20Company%20Name%3DRobinhood%2C%20size%3D256x256.svg"
    },
    {
        ticker: "CRMx",
        name: "Salesforce",
        mint: "XsczbcQ3zfcgAEt9qHQES8pxKAVG5rujPSHQEXi4kaN",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684bf3670e24ef4c92a6a7fc_Ticker%3DCRM%2C%20Company%20Name%3DSP500%2C%20size%3D256x256.svg"
    },
    {
        ticker: "SPYx",
        name: "SP500",
        mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/685116624ae31d5ceb724895_Ticker%3DSPX%2C%20Company%20Name%3DSP500%2C%20size%3D256x256.svg",
        category: Category.ETF,
        description: "SPDR S&P 500 ETF Trust (SPY) is an exchange-traded fund that seeks to track the performance of the S&P 500 Index, representing 500 of the largest publicly traded companies in the U.S. It offers broad exposure to the U.S. equity market and is one of the most widely traded ETFs globally.",
    },
    {
        ticker: "TSLAx",
        name: "Tesla",
        mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684aaf9559b2312c162731f5_Ticker%3DTSLA%2C%20Company%20Name%3DTesla%20Inc.%2C%20size%3D256x256.svg"
    },
    {
        ticker: "TMOx",
        name: "Thermo Fisher",
        mint: "Xs8drBWy3Sd5QY3aifG9kt9KFs2K3PGZmx7jWrsrk57",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684bf4d930b0fdc50503056d_Ticker%3DTMO%2C%20Company%20Name%3DThermo_Fisher_Scientific%2C%20size%3D256x256.svg"
    },
    {
        ticker: "TQQQx",
        name: "TQQQ",
        category: Category.ETF,
        mint: "XsjQP3iMAaQ3kQScQKthQpx9ALRbjKAjQtHg6TFomoc",
        description: "ProShares UltraPro QQQ (TQQQ) is a leveraged exchange-traded fund designed to deliver three times the daily performance of the Nasdaq-100 Index. It targets short-term traders and is intended for use over brief holding periods due to its daily reset and high volatility.",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/685125548a5829b9b59a6156_TQQQx.svg"
    },
    {
        ticker: "UNHx",
        name: "UnitedHealth",
        mint: "XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684abb4c69185d8a871e2ab5_Ticker%3DUNH%2C%20Company%20Name%3DUnited%20Health%2C%20size%3D256x256.svg"
    },
    {
        ticker: "VTIx",
        name: "Vanguard",
        mint: "XsssYEQjzxBCFgvYFFNuhJFBeHNdLWYeUSP8F45cDr9",
        category: Category.ETF,
        description: "Vanguard Total Stock Market Index Fund ETF (VTI) is an exchange-traded fund that seeks to track the performance of the CRSP U.S. Total Market Index, covering nearly all publicly traded U.S. companies. It offers broad exposure to large-, mid-, small-, and micro-cap stocks across all sectors.",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/68511e335ee1314f602d9a7c_Ticker%3DVTI%2C%20Company%20Name%3DVanguard%2C%20size%3D256x256.svg"
    },
    {
        ticker: "Vx",
        name: "Visa",
        mint: "XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684acfd76eb8395c6d1d2210_Ticker%3DV%2C%20Company%20Name%3DVisa%2C%20size%3D256x256.svg"
    },
    {
        ticker: "WMTx",
        name: "Walmart",
        mint: "Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci",
        image: "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684bebd366d5089b2da3cf7e_Ticker%3DWMT%2C%20Company%20Name%3DWalmart%2C%20size%3D256x256.svg"
    }
]
