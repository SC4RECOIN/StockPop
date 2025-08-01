import { BaseAsset } from '@/api/src/models';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

const BASE_URL = 'https://lite-api.jup.ag/ultra/v1';
const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36' }

export interface JupiterUltraOrderResponse {
  mode: string;
  swapType: string;
  router: string;
  requestId: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
    bps: number;
  }[];
  inputMint: string;
  outputMint: string;
  feeBps: number;
  taker: string;
  gasless: boolean;
  transaction: string;
  prioritizationFeeLamports: number;
  errorMessage?: string;
  inUsdValue: number;
  outUsdValue: number;
  priceImpact: number;
  swapUsdValue: number;
  totalTime: number;
}

export interface JupiterUltraExecuteResponse {
  status: 'Success' | 'Failed';
  signature: string;
  slot?: string;
  code?: number;
  inputAmountResult?: string;
  outputAmountResult?: string;
  swapEvents?: Array<{
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
  }>;
  error?: string;
}

export interface JupiterUltraBalancesResponse {
  balances: Array<{
    mint: string;
    amount: string;
    decimals: number;
    uiAmount: number;
  }>;
}

export interface JupiterUltraSwapResponse {
  success: boolean;
  signature?: string;
  error?: Error | string;
  inputAmount: number;
  outputAmount: number;
}

export interface SwapCallback {
  statusCallback?: (status: string) => void;
  isComponentMounted?: () => boolean;
}

export class JupiterUltraService {
  static async getSwapOrder(
    inputMint: string,
    outputMint: string,
    amount: string | number,
    taker: string
  ): Promise<JupiterUltraOrderResponse> {
    console.log(`Input: ${inputMint} -> Output: ${outputMint}, Amount: ${amount}`);
    const ultraOrderUrl = `${BASE_URL}/order`;

    const response = await fetch(`${ultraOrderUrl}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&taker=${taker}`);
    console.log("Jupiter swap order response: ", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('order error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      console.error(`${ultraOrderUrl}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&taker=${taker}`)
      throw new Error(
        `Failed to get swap order: ${response.statusText}${errorData?.error ? ` - ${errorData.error}` : ''
        }`
      );
    }

    const data = await response.json();
    console.log("✅ swap order received:", JSON.stringify(data));

    return data;
  }

  static async executeSwapOrder(
    signedTransaction: VersionedTransaction,
    requestId: string
  ): Promise<JupiterUltraExecuteResponse> {
    console.log(`Request ID: ${requestId}`);
    const ultraExecuteUrl = `${BASE_URL}/execute`;

    const requestBody = {
      signedTransaction: Buffer.from(signedTransaction.serialize()).toString('base64'),
      requestId,
    };

    const response = await fetch(ultraExecuteUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log("Jupiter execute response: ", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Ultra execute error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(
        `Failed to execute swap: ${response.statusText}${errorData?.error ? ` - ${errorData.error}` : ''
        }`
      );
    }

    const data = await response.json();
    console.log("✅ swap execute response:", JSON.stringify(data));

    return data;
  }

  static async getBalances(walletAddress: string): Promise<JupiterUltraBalancesResponse> {
    try {
      console.log('💰 Getting wallet balances');
      console.log(`Wallet: ${walletAddress}`);

      const ultraBalancesUrl = `${BASE_URL}/balances?wallet=${walletAddress}`;
      const response = await fetch(ultraBalancesUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Ultra balances error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          `Failed to get balances: ${response.statusText}${errorData?.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        console.error('Invalid balances response:', data);
        throw new Error(data.error || 'Invalid response from balances API');
      }

      console.log('✅ balances received');
      return data.data;
    } catch (error) {
      console.error('Ultra balances error:', error);
      throw new Error(`Failed to get balances: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getSwapOrderFromTokenInfo(
    inputToken: BaseAsset,
    outputToken: BaseAsset,
    inputAmount: string,
    taker: string
  ): Promise<JupiterUltraOrderResponse | null> {
    try {
      // Validate tokens
      if (!inputToken.id || !outputToken.id) {
        console.error('Invalid tokens for order:', { inputToken, outputToken });
        return null;
      }

      // Convert input amount to integer with proper decimal handling
      const inputAmountNum = parseFloat(inputAmount);
      if (isNaN(inputAmountNum) || inputAmountNum <= 0) {
        console.error('Invalid input amount for order:', inputAmount);
        return null;
      }

      // Calculate amount in lamports/base units
      const amountInBaseUnits = inputAmountNum * Math.pow(10, inputToken.decimals);
      console.log(`Converting ${inputAmountNum} ${inputToken.symbol} to ${amountInBaseUnits} base units`);

      return this.getSwapOrder(
        inputToken.id,
        outputToken.id,
        amountInBaseUnits,
        taker
      );
    } catch (error) {
      console.error('Error getting swap order:', error);
      return null;
    }
  }

  /**
   * Executes a complete swap flow: get order -> sign transaction -> execute
   */
  static async executeUltraSwap(
    inputToken: BaseAsset,
    outputToken: BaseAsset,
    inputAmount: string,
    walletPublicKey: PublicKey,
    sendBase64Transaction: (base64Tx: string, connection: any, options?: any) => Promise<string>,
    connection: Connection,
  ): Promise<JupiterUltraSwapResponse> {

    const updateStatus = (status: string) => {
      console.log(`Status: ${status}`);
    };

    try {
      updateStatus('Getting swap order from Jupiter...');

      const inputLamports = JupiterUltraService.toBaseUnits(inputAmount, inputToken.decimals);

      // Get the swap order from our server
      const order = await JupiterUltraService.getSwapOrder(
        inputToken.id,
        outputToken.id,
        inputLamports.toString(),
        walletPublicKey.toString()
      );

      if (!order || !order.transaction) {
        throw new Error('Failed to get a valid swap order from the server.');
      }

      updateStatus('Sending transaction to wallet for signing...');

      const signature = await sendBase64Transaction(
        order.transaction,
        connection,
        {
          statusCallback: updateStatus,
        }
      );

      if (!signature) {
        throw new Error('Transaction was not signed or failed to send.');
      }

      updateStatus('Swap successful! Finalizing...');

      return {
        success: true,
        signature: signature,
        inputAmount: JupiterUltraService.fromBaseUnits(order.inAmount, inputToken.decimals),
        outputAmount: JupiterUltraService.fromBaseUnits(order.outAmount, outputToken.decimals)
      };
    } catch (error: any) {
      console.error('Swap execution failed:', error);
      updateStatus('Swap failed.');
      return {
        success: false,
        error: error.message || 'An unknown error occurred during the swap.',
        inputAmount: parseFloat(inputAmount),
        outputAmount: 0
      };
    }
  }

  /**
   * Convert amount to base units (lamports)
   */
  static toBaseUnits(amount: string, decimals: number): number {
    const amountNum = parseFloat(amount);
    return Math.round(amountNum * Math.pow(10, decimals));
  }

  /**
   * Convert from base units to readable amount
   */
  static fromBaseUnits(amount: string | number, decimals: number): number {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    return amountNum / Math.pow(10, decimals);
  }
} 