import { useState, useCallback, useSyncExternalStore } from 'react';

export interface CompanyTypeConfig {
  value: string;
  label: string;
  color: string;
  description?: string;
}

const STORAGE_KEY = 'company_type_configs';

const DEFAULT_TYPES: CompanyTypeConfig[] = [
  { value: 'direct_competitor', label: 'Direct Competitor', color: '#ef4444' },
  { value: 'indirect_competitor', label: 'Indirect Competitor', color: '#f97316' },
  { value: 'geographic_competitor', label: 'Geographic', color: '#3b82f6' },
  { value: 'aspirational', label: 'Aspirational', color: '#a855f7' },
  { value: 'market_leader', label: 'Market Leader', color: '#eab308' },
  { value: 'emerging_threat', label: 'Emerging Threat', color: '#ec4899' },
  { value: 'partner', label: 'Partner', color: '#22c55e' },
  { value: 'customer', label: 'Customer', color: '#6366f1' },
];

// Listeners for useSyncExternalStore
let listeners: (() => void)[] = [];
function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): CompanyTypeConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TYPES;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TYPES;
  }
}

function save(types: CompanyTypeConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/** React hook: returns live company type configs from localStorage */
export function useCompanyTypes(): CompanyTypeConfig[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_TYPES);
}

/** Non-hook getter for use outside React */
export function getCompanyTypes(): CompanyTypeConfig[] {
  return getSnapshot();
}

export function addCompanyType(type: CompanyTypeConfig) {
  const current = getSnapshot();
  if (current.some((t) => t.value === type.value)) {
    throw new Error('A type with this value already exists');
  }
  save([...current, type]);
}

export function updateCompanyType(value: string, updates: Partial<Omit<CompanyTypeConfig, 'value'>>) {
  const current = getSnapshot();
  save(current.map((t) => (t.value === value ? { ...t, ...updates } : t)));
}

export function deleteCompanyType(value: string) {
  const current = getSnapshot();
  save(current.filter((t) => t.value !== value));
}

export function resetCompanyTypes() {
  save(DEFAULT_TYPES);
}
