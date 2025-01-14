import React from 'react';
import { Result } from '../ResultsTable';

interface StatusSectionProps {
  type: Result['type'];
  status: Result['status'];
  getTypeLabel: (type: string) => string;
}

export const StatusSection: React.FC<StatusSectionProps> = ({ type, status, getTypeLabel }) => {
  return (
    <>
      <div className="win98-container p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-700">Тип</div>
        <div className="win98-inset p-3 bg-gray-50">
          {getTypeLabel(type)}
        </div>
      </div>

      <div className="win98-container p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-700">Статус проверки</div>
        <div className="win98-inset p-3 bg-gray-50">
          {status === 'pending' && 'Ожидание'}
          {status === 'checking' && (
            <span className="text-blue-600 animate-pulse">Проверка...</span>
          )}
          {status === 'done' && (
            <span className="text-green-600">Завершено</span>
          )}
        </div>
      </div>
    </>
  );
};