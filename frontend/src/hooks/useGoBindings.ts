import { useEffect, useState } from 'react';
import { GetBackendUrl, GetHWID } from '../../wailsjs/go/utils/utils';

export function useGoFunctions() {
  const [backendUrl, setBackendUrl] = useState('');
  const [HWID, setHWID] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setBackendUrl(await GetBackendUrl());
      setHWID(await GetHWID());
    };
    fetchData();
  }, []);

  return {
    backendUrl,
    GetBackendUrl,
    GetHWID,
    HWID,
  };
}
