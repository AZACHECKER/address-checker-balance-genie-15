import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Token } from '@/utils/chainUtils';
import { ResultTableRow } from './TableRow';
import { DetailsDialog } from './details/DetailsDialog';

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
  privateKey?: string;
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
              <ResultTableRow
                key={index}
                result={result}
                getTypeLabel={getTypeLabel}
                hasNonZeroBalance={hasNonZeroBalance}
                onSelect={setSelectedResult}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <DetailsDialog
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
        getTypeLabel={getTypeLabel}
        formatBalance={formatBalance}
      />
    </>
  );
};