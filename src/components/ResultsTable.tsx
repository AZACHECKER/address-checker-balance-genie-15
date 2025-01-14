import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Token } from '@/utils/chainUtils';

export interface Balance {
  chainId: string;
  networkName: string;
  amount: string;
  rpcUrl?: string;
  tokens?: Token[];
}

export interface Result {
  address: string;
  type: 'address' | 'private_key' | 'mnemonic';
  balances: Balance[];
  status: 'pending' | 'checking' | 'done';
  progress?: number;
  totalRpcs?: number;
  checkedRpcs?: number;
}

interface ResultsTableProps {
  results: Result[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [selectedResult, setSelectedResult] = React.useState<Result | null>(null);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'address':
        return 'Адрес';
      case 'private_key':
        return 'Приватный ключ';
      case 'mnemonic':
        return 'Мнемоника';
      default:
        return type;
    }
  };

  const formatBalance = (balance: string, decimals: number = 18) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    return num.toFixed(6);
  };

  const hasNonZeroBalance = (balance: Balance) => {
    return parseFloat(balance.amount) > 0 || (balance.tokens && balance.tokens.some(token => parseFloat(token.balance) > 0));
  };

  return (
    <>
      <div className="win98-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#dfdfdf] border-b border-[#808080]">
              <TableHead>Адрес</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Прогресс</TableHead>
              <TableHead>Балансы</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index} className="hover:bg-[#dfdfdf] border-b border-[#808080]">
                <TableCell 
                  className="font-mono text-xs md:text-sm break-all cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setSelectedResult(result)}
                >
                  {result.address}
                </TableCell>
                <TableCell>{getTypeLabel(result.type)}</TableCell>
                <TableCell>
                  {result.status === 'pending' && <span className="text-gray-600">Ожидание</span>}
                  {result.status === 'checking' && (
                    <span className="text-blue-600 animate-pulse">Проверка...</span>
                  )}
                  {result.status === 'done' && (
                    <span className="text-green-600">Завершено</span>
                  )}
                </TableCell>
                <TableCell>
                  {(result.status === 'checking' || result.status === 'done') && (
                    <div className="space-y-2">
                      <Progress value={result.progress} className="win98-inset h-2" />
                      <div className="text-xs text-gray-600">
                        Проверено {result.checkedRpcs} из {result.totalRpcs} RPC
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {result.balances
                      .filter(hasNonZeroBalance)
                      .map((balance, idx) => (
                        <div 
                          key={idx} 
                          className="text-xs md:text-sm win98-inset p-2 cursor-pointer hover:bg-gray-100 text-green-600"
                          onClick={() => setSelectedResult(result)}
                        >
                          <span className="font-medium">{balance.networkName}:</span>{' '}
                          <span className="font-mono">{balance.amount}</span>
                        </div>
                    ))}
                    {result.status === 'checking' && (
                      <div className="text-xs text-gray-600 animate-pulse">
                        Проверка балансов...
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="win98-container max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детальная информация</DialogTitle>
            <DialogDescription>
              Информация о балансах на всех проверенных сетях
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Адрес</div>
                <div className="font-mono text-sm break-all win98-inset p-3">
                  {selectedResult.address}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">Тип</div>
                <div className="win98-inset p-3">
                  {getTypeLabel(selectedResult.type)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">Статус проверки</div>
                <div className="win98-inset p-3">
                  {selectedResult.status === 'pending' && 'Ожидание'}
                  {selectedResult.status === 'checking' && (
                    <span className="text-blue-600 animate-pulse">Проверка...</span>
                  )}
                  {selectedResult.status === 'done' && (
                    <span className="text-green-600">Завершено</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">Балансы и токены</div>
                <div className="space-y-3 win98-inset p-4 max-h-60 overflow-y-auto">
                  {selectedResult.balances.map((balance, idx) => (
                    <Accordion type="single" collapsible key={idx}>
                      <AccordionItem value={`network-${idx}`} className="win98-container p-3">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-col items-start">
                            <div className="font-medium">{balance.networkName}</div>
                            <div className={`font-mono text-sm ${
                              parseFloat(balance.amount) > 0 ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {balance.amount}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {balance.tokens && balance.tokens.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {balance.tokens.map((token, tokenIdx) => (
                                <div key={tokenIdx} className="win98-inset p-2">
                                  <div className="font-medium">{token.symbol}</div>
                                  <div className={`font-mono text-sm ${
                                    parseFloat(token.balance) > 0 ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {formatBalance(token.balance, token.decimals)}
                                  </div>
                                  <div className="text-xs text-gray-600 break-all">
                                    {token.address}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 mt-2">
                              Токены не найдены
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};