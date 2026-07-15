import { useState, useEffect } from 'react';
import { useUpdater } from '../hooks/useUpdater';
import { UpdateModal } from '../components/UpdateModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MainLayout } from '../components/layout';
import { Download, Check, AlertCircle, Loader } from 'lucide-react';

const Settings = () => {
  const updater = useUpdater();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Show modal when update becomes available
  useEffect(() => {
    if (updater.updateInfo.available && showUpdateModal === false) {
      setShowUpdateModal(true);
    }
  }, [updater.updateInfo.available]);

  const handleManualCheck = async () => {
    const now = new Date().toLocaleTimeString('pt-BR');
    setLastCheckTime(now);
    await updater.checkForUpdates();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400 mt-1">Gerencie as preferências do launcher</p>
        </div>

        {/* Update Section */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Atualizações</h2>

            {/* Update Status */}
            <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                {updater.updateInfo.downloading ? (
                  <Loader className="w-5 h-5 text-blue-400 mt-0.5 animate-spin" />
                ) : updater.updateInfo.available ? (
                  <Download className="w-5 h-5 text-yellow-400 mt-0.5" />
                ) : updater.updateInfo.error ? (
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                )}

                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {updater.updateInfo.downloading
                      ? 'Verificando atualizações...'
                      : updater.updateInfo.available
                      ? `Atualização disponível: v${updater.updateInfo.version}`
                      : updater.updateInfo.error
                      ? 'Erro na verificação'
                      : 'Você está na versão mais recente'}
                  </h3>

                  {updater.updateInfo.error && (
                    <p className="text-sm text-red-300 mt-1">{updater.updateInfo.error}</p>
                  )}

                  {lastCheckTime && !updater.updateInfo.downloading && (
                    <p className="text-xs text-slate-400 mt-1">
                      Última verificação: {lastCheckTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Check Button */}
            <Button
              onClick={handleManualCheck}
              disabled={updater.updateInfo.downloading}
              className="bg-accent hover:bg-accent/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Verificar Atualizações
            </Button>

            <p className="text-xs text-slate-400 mt-3">
              O launcher verifica automaticamente por atualizações ao iniciar
            </p>
          </div>
        </Card>

        {/* About Section */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Sobre</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nome:</span>
                <span className="text-white font-semibold">MinhaLoja Launcher</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Versão:</span>
                <span className="text-white font-semibold">0.1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Plataforma:</span>
                <span className="text-white font-semibold capitalize">
                  {navigator.userAgent.includes('Linux')
                    ? 'Linux'
                    : navigator.userAgent.includes('Win')
                    ? 'Windows'
                    : navigator.userAgent.includes('Mac')
                    ? 'macOS'
                    : 'Desconhecida'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Update Modal */}
      <UpdateModal
        isOpen={showUpdateModal && updater.updateInfo.available}
        version={updater.updateInfo.version}
        changelog={updater.updateInfo.body}
        onInstall={updater.installUpdate}
        onClose={() => setShowUpdateModal(false)}
        isInstalling={updater.updateInfo.installing}
      />
    </MainLayout>
  );
};

export default Settings;
