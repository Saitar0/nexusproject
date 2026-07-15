import { useEffect, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { exit } from '@tauri-apps/plugin-process';

interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  downloading: boolean;
  installing: boolean;
  error?: string;
}

export function useUpdater() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    downloading: false,
    installing: false,
  });
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdates = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, downloading: true, error: undefined }));
      const updateAvailable = await check();

      if (updateAvailable) {
        setUpdate(updateAvailable);
        setUpdateInfo({
          available: true,
          version: updateAvailable.version,
          body: updateAvailable.body,
          downloading: false,
          installing: false,
        });
      } else {
        setUpdateInfo({
          available: false,
          downloading: false,
          installing: false,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setUpdateInfo((prev) => ({
        ...prev,
        downloading: false,
        error: errorMsg,
      }));
    }
  };

  const installUpdate = async () => {
    if (!update) return;

    try {
      setUpdateInfo((prev) => ({ ...prev, installing: true }));
      await update.downloadAndInstall();
      
      // Reinicia o app
      await exit(0);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro na instalação';
      setUpdateInfo((prev) => ({
        ...prev,
        installing: false,
        error: errorMsg,
      }));
    }
  };

  return {
    updateInfo,
    update,
    checkForUpdates,
    installUpdate,
  };
}
