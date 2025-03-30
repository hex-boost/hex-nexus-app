import { Utils } from '@utils';
import { useEffect, useState } from 'react';

export function useGoFunctions() {
  const [backendUrl, setBackendUrl] = useState('');
  const [HWID, setHWID] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setBackendUrl(await Utils.GetBackendUrl());
      setHWID(await Utils.GetHWID());
    };
    fetchData();
  }, []);

  return {
    backendUrl,
    Utils,
    HWID,
  };
}
