import React from 'react';
import InfoHint from './InfoHint';

interface LabeledFieldProps {
  label: string;
  required?: boolean;
  hintText?: string;
  hintPosition?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  children: React.ReactNode;
}

const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  required = false,
  hintText,
  hintPosition = 'right',
  className,
  children,
}) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        {hintText && (
          <div className="shrink-0">
            <InfoHint text={hintText} position={hintPosition} />
          </div>
        )}
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
};

export default LabeledField;
