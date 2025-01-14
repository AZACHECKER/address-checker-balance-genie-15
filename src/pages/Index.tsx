import React, { useState, useEffect, useCallback } from 'react';
import { InputArea } from '@/components/InputArea';
import { FileUpload } from '@/components/FileUpload';
import { ResultsTable, Result } from '@/components/ResultsTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  fetchChainList, 
  checkAddressBalance,
  deriveAddressFromPrivateKey,
  deriveAddressFromMnemonic
} from '@/utils/chainUtils';

const Index = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chains, setChains] = useState<any[]>([]);
  const [totalRpcs, setTotalRpcs] = useState(0);

  useEffect(() => {
    const loadChains = async () => {
      try {
        const chainList = await fetchChainList();
        setChains(chainList);
        const totalRpcCount = chainList.reduce((acc, chain) => acc + chain.rpc.length, 0);
        setTotalRpcs(totalRpcCount);
        console.log('Загружено сетей:', chainList.length, 'Всего RPC:', totalRpcCount);
      } catch (error) {
        console.error('Ошибка загрузки списка сетей:', error);
        toast.error('Не удалось загрузить список сетей');
      }
    };
    loadChains();
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleFileSelect = useCallback((content: string) => {
    setInput(content);
    toast.success('Файл успешно загружен');
  }, []);

  const processInput = async () => {
    if (!input.trim()) {
      toast.error('Пожалуйста, введите данные');
      return;
    }

    if (chains.length === 0) {
      toast.error('Список сетей не загружен');
      return;
    }

    setIsProcessing(true);
    
    try {
      const lines = input.split('\n').filter(line => line.trim());
      const initialResults: Result[] = lines.map(line => {
        const type = detectInputType(line.trim());
        const address = getAddressFromInput(line.trim(), type);
        return {
          address,
          type,
          balances: [],
          status: 'pending',
          totalRpcs,
          checkedRpcs: 0,
          progress: 0
        };
      });
      
      setResults(initialResults);

      // Process all addresses in parallel
      await Promise.all(initialResults.map(async (result, index) => {
        setResults(prev => prev.map((r, idx) => 
          idx === index ? { ...r, status: 'checking' } : r
        ));

        let checkedRpcs = 0;
        
        for (const chain of chains) {
          const balance = await checkAddressBalance(
            result.address, 
            chain,
            (rpc, success) => {
              checkedRpcs++;
              const progress = (checkedRpcs / totalRpcs) * 100;
              setResults(prev => prev.map((r, idx) => 
                idx === index ? { 
                  ...r, 
                  checkedRpcs,
                  progress
                } : r
              ));
            }
          );
          
          if (balance) {
            setResults(prev => prev.map((r, idx) => 
              idx === index ? {
                ...r,
                balances: [...r.balances, balance]
              } : r
            ));
          }
        }
        
        setResults(prev => prev.map((r, idx) => 
          idx === index ? {
            ...r,
            status: 'done',
            progress: 100
          } : r
        ));
      }));

      toast.success('Проверка завершена');
    } catch (error) {
      console.error('Ошибка обработки:', error);
      toast.error('Произошла ошибка при обработке');
    } finally {
      setIsProcessing(false);
    }
  };

  const detectInputType = useCallback((input: string): 'address' | 'private_key' | 'mnemonic' => {
    input = input.trim();
    if (input.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
      return 'address';
    } else if (input.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
      return 'private_key';
    } else if (input.split(' ').length >= 12) {
      return 'mnemonic';
    }
    return 'address';
  }, []);

  const getAddressFromInput = useCallback((input: string, type: 'address' | 'private_key' | 'mnemonic'): string => {
    switch (type) {
      case 'private_key':
        return deriveAddressFromPrivateKey(input);
      case 'mnemonic':
        return deriveAddressFromMnemonic(input);
      default:
        return input;
    }
  }, []);

  return (
    <div className="win98-container min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="win98-container p-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">
            Проверка криптовалютных адресов
          </h1>
          
          <div className="space-y-4">
            <div className="text-sm">
              Всего сетей: {chains.length} | Всего RPC: {totalRpcs}
            </div>
            
            <div className="win98-inset p-4">
              <InputArea value={input} onChange={handleInputChange} />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <FileUpload onFileSelect={handleFileSelect} />
              <Button 
                onClick={processInput}
                disabled={isProcessing || !input.trim()}
                className="win98-btn w-full md:w-auto"
              >
                {isProcessing ? 'Проверка...' : 'Проверить адреса'}
              </Button>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="win98-container p-4">
            <h2 className="text-xl font-semibold mb-4">Результаты</h2>
            <ResultsTable results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;