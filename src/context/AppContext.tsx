import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BroadbandBill,
  OutageRecord,
  CreditCalculation,
  ComplaintLetter,
  PayPalTransaction,
  UserSettings,
  AppStateData,
} from '../types';
import {
  fetchStoreData,
  updateStoreData,
  resetStoreData,
  fetchSystemStatus,
  SystemStatus,
} from '../services/api';
import {
  SAMPLE_BROADBAND_BILL,
  SAMPLE_OUTAGES,
  SAMPLE_CREDIT_CALCULATION,
  SAMPLE_COMPLAINT,
  SAMPLE_TRANSACTION,
  INITIAL_USER_SETTINGS,
} from '../data/sampleData';

export type AppSection =
  | 'overview'
  | 'bill'
  | 'outage'
  | 'calculator'
  | 'complaint'
  | 'payments'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  bill: BroadbandBill | null;
  outages: OutageRecord[];
  creditCalculation: CreditCalculation | null;
  complaints: ComplaintLetter[];
  transactions: PayPalTransaction[];
  settings: UserSettings;
  systemStatus: SystemStatus;
  isLoading: boolean;
  guidedStep: number;
  isGuidedTourActive: boolean;
  setIsGuidedTourActive: (active: boolean) => void;
  setGuidedStep: (step: number) => void;
  nextGuidedStep: () => void;
  prevGuidedStep: () => void;
  skipGuidedTour: () => void;
  updateBill: (bill: BroadbandBill) => Promise<void>;
  addOutage: (outage: OutageRecord) => Promise<void>;
  updateOutage: (outage: OutageRecord) => Promise<void>;
  deleteOutage: (id: string) => Promise<void>;
  setCreditCalculation: (calc: CreditCalculation) => Promise<void>;
  addComplaint: (complaint: ComplaintLetter) => Promise<void>;
  updateComplaint: (complaint: ComplaintLetter) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  addTransaction: (tx: PayPalTransaction) => Promise<void>;
  updateTransaction: (tx: PayPalTransaction) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<AppSection>('overview');
  const [bill, setBill] = useState<BroadbandBill | null>(SAMPLE_BROADBAND_BILL);
  const [outages, setOutages] = useState<OutageRecord[]>(SAMPLE_OUTAGES);
  const [creditCalculation, setCreditCalculationState] = useState<CreditCalculation | null>(SAMPLE_CREDIT_CALCULATION);
  const [complaints, setComplaints] = useState<ComplaintLetter[]>([SAMPLE_COMPLAINT]);
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([SAMPLE_TRANSACTION]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_USER_SETTINGS);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    geminiConfigured: true,
    paypalConfigured: false,
    paypalEnvironment: 'sandbox',
    paypalClientId: '',
    appUrl: '',
    demoModeActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Guided demo tour state (Steps 1 to 8)
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [isGuidedTourActive, setIsGuidedTourActive] = useState<boolean>(true);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync with backend on initial mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [status, storeData] = await Promise.all([
          fetchSystemStatus(),
          fetchStoreData().catch(() => null),
        ]);

        if (status) setSystemStatus(status);

        if (storeData) {
          if (storeData.bill) setBill(storeData.bill);
          if (storeData.outages) setOutages(storeData.outages);
          if (storeData.creditCalculation) setCreditCalculationState(storeData.creditCalculation);
          if (storeData.complaints) setComplaints(storeData.complaints);
          if (storeData.transactions) setTransactions(storeData.transactions);
          if (storeData.settings) setSettings(storeData.settings);
        }
      } catch (err) {
        console.warn('Initial load fallback to built-in sample data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const updateBill = async (newBill: BroadbandBill) => {
    setBill(newBill);
    try {
      await updateStoreData({ bill: newBill });
      showToast('success', 'Bill Updated', `Applied ${newBill.providerName} (${newBill.planSpeed || 'Broadband'}) details.`);
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const addOutage = async (outage: OutageRecord) => {
    const updated = [outage, ...outages];
    setOutages(updated);
    try {
      await updateStoreData({ outages: updated });
      showToast('success', 'Outage Logged', `Recorded ${outage.durationFormatted} downtime incident.`);
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const updateOutage = async (updatedOutage: OutageRecord) => {
    const updated = outages.map((o) => (o.id === updatedOutage.id ? updatedOutage : o));
    setOutages(updated);
    try {
      await updateStoreData({ outages: updated });
      showToast('info', 'Outage Updated', 'Incident record modified.');
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const deleteOutage = async (id: string) => {
    const updated = outages.filter((o) => o.id !== id);
    setOutages(updated);
    try {
      await updateStoreData({ outages: updated });
      showToast('info', 'Outage Removed', 'Incident record deleted.');
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const setCreditCalculation = async (calc: CreditCalculation) => {
    setCreditCalculationState(calc);
    try {
      await updateStoreData({ creditCalculation: calc });
      showToast('success', 'Credit Calculated', `Eligible service credit: ₹${calc.estimatedCreditAmount.toFixed(2)}`);
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const addComplaint = async (complaint: ComplaintLetter) => {
    const updated = [complaint, ...complaints];
    setComplaints(updated);
    try {
      await updateStoreData({ complaints: updated });
      showToast('success', 'Complaint Drafted', `Prepared formal letter in ${complaint.language === 'ta' ? 'Tamil' : 'English'}.`);
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const updateComplaint = async (updatedComplaint: ComplaintLetter) => {
    const updated = complaints.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c));
    setComplaints(updated);
    try {
      await updateStoreData({ complaints: updated });
      showToast('info', 'Complaint Saved', 'Draft changes saved successfully.');
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const deleteComplaint = async (id: string) => {
    const updated = complaints.filter((c) => c.id !== id);
    setComplaints(updated);
    try {
      await updateStoreData({ complaints: updated });
      showToast('info', 'Complaint Removed', 'Draft deleted.');
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const addTransaction = async (tx: PayPalTransaction) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    try {
      await updateStoreData({ transactions: updated });
      showToast('success', 'Payment Captured', `Sandbox transaction ${tx.id} confirmed.`);
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const updateTransaction = async (updatedTx: PayPalTransaction) => {
    const updated = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(updated);
    try {
      await updateStoreData({ transactions: updated });
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await updateStoreData({ settings: updated });
      showToast('success', 'Settings Saved', 'Preferences updated.');
    } catch (e) {
      console.warn('Server sync error', e);
    }
  };

  const resetAllData = async () => {
    try {
      setIsLoading(true);
      const res = await resetStoreData();
      setBill(res.bill);
      setOutages(res.outages);
      setCreditCalculationState(res.creditCalculation);
      setComplaints(res.complaints);
      setTransactions(res.transactions);
      setSettings(res.settings);
      setGuidedStep(1);
      setCurrentSection('overview');
      showToast('info', 'Data Reset', 'Restored pristine demo broadband datasets.');
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Map guided demo steps to sections
  const nextGuidedStep = () => {
    const next = Math.min(guidedStep + 1, 8);
    setGuidedStep(next);
    routeForStep(next);
  };

  const prevGuidedStep = () => {
    const prev = Math.max(guidedStep - 1, 1);
    setGuidedStep(prev);
    routeForStep(prev);
  };

  const skipGuidedTour = () => {
    setIsGuidedTourActive(false);
  };

  const routeForStep = (step: number) => {
    switch (step) {
      case 1:
        setCurrentSection('overview');
        break;
      case 2:
      case 3:
        setCurrentSection('bill');
        break;
      case 4:
        setCurrentSection('outage');
        break;
      case 5:
        setCurrentSection('calculator');
        break;
      case 6:
        setCurrentSection('complaint');
        break;
      case 7:
      case 8:
        setCurrentSection('payments');
        break;
      default:
        break;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        bill,
        outages,
        creditCalculation,
        complaints,
        transactions,
        settings,
        systemStatus,
        isLoading,
        guidedStep,
        isGuidedTourActive,
        setIsGuidedTourActive,
        setGuidedStep: (s) => {
          setGuidedStep(s);
          routeForStep(s);
        },
        nextGuidedStep,
        prevGuidedStep,
        skipGuidedTour,
        updateBill,
        addOutage,
        updateOutage,
        deleteOutage,
        setCreditCalculation,
        addComplaint,
        updateComplaint,
        deleteComplaint,
        addTransaction,
        updateTransaction,
        updateSettings,
        resetAllData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
