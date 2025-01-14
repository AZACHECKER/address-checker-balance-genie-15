import React from 'react';

interface AddressSectionProps {
  address: string;
  privateKey?: string;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ address, privateKey }) => {
  return (
    <>
      <div className="win98-container p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-700">Адрес</div>
        <div className="font-mono text-sm break-all win98-inset p-3 bg-gray-50">
          {address}
        </div>
      </div>

      {privateKey && (
        <div className="win98-container p-4 space-y-2">
          <div className="text-sm font-semibold text-gray-700">Приватный ключ</div>
          <div className="font-mono text-sm break-all win98-inset p-3 bg-yellow-50 border border-yellow-200">
            {privateKey}
          </div>
        </div>
      )}
    </>
  );
};