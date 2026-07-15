import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Download } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  version?: string;
  changelog?: string;
  onInstall: () => void;
  onClose: () => void;
  isInstalling?: boolean;
}

export function UpdateModal({
  isOpen,
  version,
  changelog,
  onInstall,
  onClose,
  isInstalling = false,
}: UpdateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-gray-800 border-blue-500 max-w-2xl w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Nova Versão Disponível</h2>
              <p className="text-blue-400 mt-1">Versão {version}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Changelog */}
          {changelog && (
            <div className="mb-6 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Alterações:</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm whitespace-pre-wrap font-mono">
                  {changelog}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-400"
              disabled={isInstalling}
            >
              Depois
            </Button>
            <Button
              onClick={onInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isInstalling}
            >
              <Download className="w-4 h-4 mr-2" />
              {isInstalling ? 'Instalando...' : 'Atualizar Agora'}
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            O app será reiniciado automaticamente após a instalação
          </p>
        </div>
      </Card>
    </div>
  );
}
