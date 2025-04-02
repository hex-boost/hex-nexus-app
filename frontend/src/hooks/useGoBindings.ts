import { Utils } from '@utils';
import { useEffect, useState } from 'react';

export function useGoFunctions() {
  const [HWID, setHWID] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setHWID(await Utils.GetHWID());
    };
    fetchData();
  }, []);

  return {
    Utils,
    HWID,
  };
}
