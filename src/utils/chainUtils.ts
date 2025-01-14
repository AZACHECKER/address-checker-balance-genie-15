import axios from 'axios';
import Web3 from 'web3';
import { toast } from 'sonner';
import { ethers } from 'ethers';

interface Chain {
  name: string;
  chain: string;
  rpc: string[];
  chainId: number;
}

export interface ChainBalance {
  chainId: string;
  networkName: string;
  amount: string;
  rpcUrl?: string;
  tokens?: Token[];
}

export interface Token {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
}

const NETWORK_NAMES: { [key: string]: string } = {
  "1": "Ethereum",
  "56": "BNB Smart Chain",
  "137": "Polygon",
  "42161": "Arbitrum One",
  "10": "Optimism",
  "43114": "Avalanche",
  "250": "Fantom",
  "8453": "Base",
  "324": "zkSync Era",
};

export const fetchChainList = async () => {
  try {
    console.log('Загрузка списка сетей...');
    const chainList: Chain[] = [];
    
    const response = await axios.get('https://raw.githubusercontent.com/XDeFi-tech/chainlist-json/refs/heads/main/export.json');
    const data = response.data;
    
    for (const [chainId, rpcs] of Object.entries(data)) {
      if (Array.isArray(rpcs) && rpcs.length > 0) {
        const filteredRpcs = rpcs.filter(rpc => {
          const isHttps = rpc.startsWith('http');
          const isProblematicEndpoint = rpc.includes('bitstack.com') || 
                                      rpc.includes('nodereal.io') ||
                                      rpc.includes('elastos.net') ||
                                      rpc.includes('mainnetloop.com');
          return isHttps && !isProblematicEndpoint;
        });

        if (filteredRpcs.length > 0) {
          chainList.push({
            name: NETWORK_NAMES[chainId] || `Chain ${chainId}`,
            chain: chainId,
            rpc: filteredRpcs,
            chainId: parseInt(chainId)
          });
        }
      }
    }
    
    console.log(`Загружено ${chainList.length} сетей с HTTP RPC`);
    return chainList;
  } catch (error) {
    console.error('Ошибка загрузки списка сетей:', error);
    toast.error('Не удалось загрузить список сетей');
    return [];
  }
};

export const deriveAddressFromPrivateKey = (privateKey: string): string => {
  try {
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    console.error('Ошибка получения адреса из приватного ключа:', error);
    return '';
  }
};

export const deriveAddressFromMnemonic = (mnemonic: string): string => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet.address;
  } catch (error) {
    console.error('Ошибка получения адреса из мнемоники:', error);
    toast.error('Ошибка при обработке мнемонической фразы');
    return '';
  }
};

const isRpcError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('cors') ||
         errorMessage.includes('failed to fetch') ||
         errorMessage.includes('network error') ||
         error.code === 429 ||
         (error.response?.status >= 400);
};

export const fetchTokens = async (address: string): Promise<Token[]> => {
  try {
    const response = await axios.get(`https://web-v2.unifront.io/v2/user/tokenList?is_all=false&id=${address}`);
    return response.data.data.map((token: any) => ({
      symbol: token.symbol,
      balance: token.balance,
      address: token.contract_address,
      decimals: token.decimals
    }));
  } catch (error) {
    console.error('Ошибка получения списка токенов:', error);
    return [];
  }
};

export const checkAddressBalance = async (
  address: string,
  chain: Chain,
  onRpcCheck?: (rpc: string, success: boolean) => void
): Promise<ChainBalance | null> => {
  let balance = '0';
  let successfulRpc = null;

  const checkRpc = async (rpc: string): Promise<{ balance: string, rpc: string } | null> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      provider.pollingInterval = 1000;
      
      onRpcCheck?.(rpc, false);
      
      const rawBalance = await provider.getBalance(address);
      const currentBalance = ethers.formatEther(rawBalance);
      
      onRpcCheck?.(rpc, true);
      
      return { balance: currentBalance, rpc };
    } catch (error) {
      if (isRpcError(error)) {
        console.error(`Ошибка проверки баланса в сети ${chain.name} (${rpc}):`, error);
      }
      onRpcCheck?.(rpc, false);
      return null;
    }
  };

  const rpcResults = await Promise.allSettled(
    chain.rpc.map(rpc => checkRpc(rpc))
  );

  const successfulResult = rpcResults
    .filter((result): result is PromiseFulfilledResult<{ balance: string, rpc: string } | null> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value)
    .find(result => result !== null);

  if (successfulResult) {
    balance = successfulResult.balance;
    successfulRpc = successfulResult.rpc;
  }

  let tokens: Token[] = [];
  if (parseFloat(balance) > 0) {
    tokens = await fetchTokens(address);
  }

  return {
    chainId: chain.chain,
    networkName: NETWORK_NAMES[chain.chain] || `Chain ${chain.chain}`,
    amount: balance,
    rpcUrl: successfulRpc,
    tokens: tokens
  };
};