import { useState, useEffect, useCallback } from 'react';
import { stixObjects } from '../data';
import type { StixObjectType } from '../types/stix';

function findObjectByType(type: string): StixObjectType | null {
  const lower = type.toLowerCase();
  return stixObjects.find((obj) => obj.type === lower) ?? null;
}

function getTypeFromUrl(): StixObjectType | null {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  return type ? findObjectByType(type) : null;
}

export function useUrlType() {
  const [selectedObject, setSelectedObjectState] = useState<StixObjectType | null>(getTypeFromUrl);

  const setSelectedObject = useCallback((obj: StixObjectType | null) => {
    setSelectedObjectState(obj);
    const url = new URL(window.location.href);
    if (obj) {
      url.searchParams.set('type', obj.type);
    } else {
      url.searchParams.delete('type');
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedObjectState(getTypeFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { selectedObject, setSelectedObject };
}
