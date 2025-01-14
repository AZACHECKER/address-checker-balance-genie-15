import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export interface Token {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
}

export interface Balance {
  chainId: string;
  networkName: string;
  amount: string;
  rpcUrl?: string;
  tokens?: Token[];
}

export interface Chain {
  name: string;
  chain: string;
  rpc: string[];
  chainId: number;
}

// Расширенный список сетей из chainlist.org
export const NETWORK_NAMES: { [key: string]: string } = {
  "1": "Ethereum Mainnet",
  "56": "BNB Smart Chain",
  "137": "Polygon",
  "42161": "Arbitrum One",
  "10": "Optimism",
  "43114": "Avalanche C-Chain",
  "250": "Fantom Opera",
  "8453": "Base",
  "324": "zkSync Era",
  "100": "Gnosis Chain",
  "42220": "Celo",
  "1284": "Moonbeam",
  "1285": "Moonriver",
  "25": "Cronos",
  "128": "Huobi ECO Chain",
  "66": "OKXChain",
  "1666600000": "Harmony One",
  "2222": "Kava",
  "1088": "Metis",
  "288": "Boba Network",
  "42262": "Oasis Emerald",
  "1313161554": "Aurora",
  "592": "Astar",
  "106": "Velas",
  "1975": "OasisChain",
  "2000": "Dogechain",
  "40": "Telos",
  "1030": "Conflux",
  "1234": "Step Network",
  "7700": "Canto",
  "8217": "Klaytn",
  "9001": "Evmos",
  "32659": "Fusion",
  "1818": "Cube Chain",
  "2001": "Milkomeda C1",
  "10000": "SmartBCH",
  "88": "TomoChain"
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
          const isHttps = rpc.startsWith('https');  // Only use HTTPS endpoints
          const isProblematicEndpoint = rpc.includes('bitstack.com') || 
                                      rpc.includes('nodereal.io') ||
                                      rpc.includes('elastos.net') ||
                                      rpc.includes('mainnetloop.com') ||
                                      rpc.includes('expanse.tech') ||  // Remove problematic endpoints
                                      rpc.includes('blockpi.network') ||
                                      rpc.includes('nodeconnect.org') ||
                                      rpc.includes('unifra.io') ||
                                      rpc.includes('flashbots.net') ||
                                      rpc.includes('getblock.io');
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
    
    console.log(`Загружено ${chainList.length} сетей с HTTPS RPC`);
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

const isRpcError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const isRateLimitError = error.status === 429;
  const isCorsError = errorMessage.includes('cors');
  const isNetworkError = 
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network error');
  const isClientError = error.status >= 400 && error.status < 500;
  
  return isRateLimitError || isCorsError || isNetworkError || isClientError;
};

export const checkAddressBalance = async (
  address: string,
  chain: Chain,
  onRpcCheck?: (rpc: string, success: boolean) => void
): Promise<Balance | null> => {
  let balance = '0';
  let successfulRpc = null;

  const checkRpc = async (rpc: string): Promise<{ balance: string, rpc: string } | null> => {
    try {
      console.log(`Проверка RPC ${rpc} для сети ${chain.name}`);
      const provider = new ethers.JsonRpcProvider(rpc);
      provider.pollingInterval = 1000;
      
      onRpcCheck?.(rpc, false);
      
      const rawBalance = await provider.getBalance(address);
      const currentBalance = ethers.formatEther(rawBalance);
      
      console.log(`Успешно получен баланс через RPC ${rpc}: ${currentBalance}`);
      onRpcCheck?.(rpc, true);
      
      return { balance: currentBalance, rpc };
    } catch (error) {
      if (isRpcError(error)) {
        console.error(`Ошибка RPC ${rpc} для сети ${chain.name}:`, error);
      }
      onRpcCheck?.(rpc, false);
      return null;
    }
  };

  // Try RPC endpoints one by one until we get a successful response
  for (const rpc of chain.rpc) {
    const result = await checkRpc(rpc);
    if (result) {
      balance = result.balance;
      successfulRpc = result.rpc;
      break;
    }
  }

  if (!successfulRpc) {
    console.log(`Не удалось получить баланс для сети ${chain.name} через доступные RPC`);
    return null;
  }

  // Only fetch tokens if we have a successful RPC connection
  let tokens: Token[] = [];
  try {
    tokens = await fetchTokens(address);
  } catch (error) {
    console.error('Ошибка при получении токенов:', error);
  }

  return {
    chainId: chain.chain,
    networkName: NETWORK_NAMES[chain.chain] || `Chain ${chain.chain}`,
    amount: balance,
    rpcUrl: successfulRpc,
    tokens: tokens
  };
};
