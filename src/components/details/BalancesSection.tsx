import React from 'react';
import { Balance, Token } from '@/utils/chainUtils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BalancesSectionProps {
  balances: Balance[];
  formatBalance: (balance: string, decimals?: number) => string;
}

export const BalancesSection: React.FC<BalancesSectionProps> = ({ balances, formatBalance }) => {
  return (
    <div className="win98-container p-4 space-y-2">
      <div className="text-sm font-semibold text-gray-700">Балансы и токены</div>
      <div className="space-y-3 win98-inset p-4 max-h-60 overflow-y-auto bg-gray-50">
        {balances.map((balance, idx) => (
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
                      <div key={tokenIdx} className="win98-inset p-2 bg-white">
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
  );
};