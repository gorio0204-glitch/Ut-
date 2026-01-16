import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppPreferences;
  onUpdate: (prefs: AppPreferences) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onUpdate }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const toggle = (key: keyof AppPreferences) => {
    onUpdate({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">{t('settingsTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="font-medium text-slate-700">{t('showPerformance')}</span>
            <button 
              onClick={() => toggle('showPerformance')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.showPerformance ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showPerformance ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="font-medium text-slate-700">{t('showChart')}</span>
             <button 
              onClick={() => toggle('showChart')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.showChart ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showChart ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="font-medium text-slate-700">{t('showDividends')}</span>
             <button 
              onClick={() => toggle('showDividends')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.showDividends ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showDividends ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="font-medium text-slate-700">{t('compactMode')}</span>
             <button 
              onClick={() => toggle('compactMode')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.compactMode ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.compactMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;