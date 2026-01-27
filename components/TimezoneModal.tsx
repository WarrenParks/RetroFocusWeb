import React, { useState, useEffect } from 'react';
import { TuiBox } from './TuiBox';
import { getTimezoneOffset, setTimezoneOffset } from '../utils/formatTime';

interface TimezoneModalProps {
    onClose: () => void;
    onSave: () => void;
}

export const TimezoneModal: React.FC<TimezoneModalProps> = ({ onClose, onSave }) => {
    const [selectedOffset, setSelectedOffset] = useState<number | null>(null);

    useEffect(() => {
        setSelectedOffset(getTimezoneOffset());
    }, []);

    const handleSave = () => {
        setTimezoneOffset(selectedOffset);
        onSave();
        onClose();
    };

    const options = [
        { label: 'BROWSER DEFAULT', value: null },
        { label: 'EST (UTC-5)', value: -300 },
        { label: 'EDT (UTC-4)', value: -240 },
        { label: 'CST (UTC-6)', value: -360 },
        { label: 'CDT (UTC-5)', value: -300 }, // same as EST but labeled for clarity
        { label: 'PST (UTC-8)', value: -480 },
        { label: 'PDT (UTC-7)', value: -420 },
        { label: 'UTC (GMT+0)', value: 0 },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <TuiBox title="SYSTEM_CONFIG // TIMEZONE" className="w-full max-w-md bg-black">
                <div className="p-6 space-y-6">
                    <p className="text-green-400 text-sm mb-4">
                        Override browser timezone detection. Useful for privacy-focused browsers that spoof UTC time.
                    </p>

                    <div className="space-y-2">
                        {options.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => setSelectedOffset(opt.value)}
                                className={`w-full text-left px-4 py-2 border ${selectedOffset === opt.value
                                        ? 'border-green-400 bg-green-900/30 text-green-300'
                                        : 'border-green-900/50 text-green-700 hover:border-green-700'
                                    } transition-colors font-mono text-sm`}
                            >
                                {selectedOffset === opt.value ? '[x]' : '[ ]'} {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-green-700 hover:text-green-500 transition-colors uppercase text-sm tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-green-900/20 border-2 border-green-600 text-green-400 hover:bg-green-900/40 hover:text-green-200 transition-all uppercase font-bold text-sm tracking-wider"
                        >
                            Apply & Reload
                        </button>
                    </div>
                </div>
            </TuiBox>
        </div>
    );
};
