import React from 'react';
import { Result } from './ResultsTable';
import { TableCell, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface ResultTableRowProps {
  result: Result;
  getTypeLabel: (type: string) => string;
  hasNonZeroBalance: (balance: any) => boolean;
  onSelect: (result: Result) => void;
}

export const ResultTableRow: React.FC<ResultTableRowProps> = ({
  result,
  getTypeLabel,
  hasNonZeroBalance,
  onSelect,
}) => {
  return (
    <TableRow className="hover:bg-[#dfdfdf] border-b border-[#808080]">
      <TableCell 
        className="font-mono text-xs md:text-sm break-all cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => onSelect(result)}
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
                onClick={() => onSelect(result)}
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
  );
};