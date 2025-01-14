import React from 'react';
import { Result } from '../ResultsTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddressSection } from './AddressSection';
import { StatusSection } from './StatusSection';
import { BalancesSection } from './BalancesSection';

interface DetailsDialogProps {
  result: Result | null;
  onClose: () => void;
  getTypeLabel: (type: string) => string;
  formatBalance: (balance: string, decimals?: number) => string;
}

export const DetailsDialog: React.FC<DetailsDialogProps> = ({
  result,
  onClose,
  getTypeLabel,
  formatBalance,
}) => {
  if (!result) return null;

  return (
    <Dialog open={!!result} onOpenChange={onClose}>
      <DialogContent className="win98-container max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Детальная информация</DialogTitle>
          <DialogDescription className="text-gray-600">
            Информация о балансах на всех проверенных сетях
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <AddressSection address={result.address} privateKey={result.privateKey} />
          <StatusSection 
            type={result.type} 
            status={result.status} 
            getTypeLabel={getTypeLabel} 
          />
          <BalancesSection 
            balances={result.balances} 
            formatBalance={formatBalance} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};