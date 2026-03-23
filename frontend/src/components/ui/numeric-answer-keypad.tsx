interface NumericAnswerKeypadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const NUMERIC_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'];

function appendNumericKey(currentValue: string, key: string) {
  if (key === '-') {
    if (currentValue.includes('-')) {
      return currentValue;
    }
    return currentValue ? `-${currentValue.replace('-', '')}` : '-';
  }

  if (key === '.') {
    if (currentValue.includes('.')) {
      return currentValue;
    }
    if (!currentValue || currentValue === '-') {
      return `${currentValue || ''}0.`;
    }
    return `${currentValue}.`;
  }

  if (currentValue === '0') {
    return key;
  }

  if (currentValue === '-0') {
    return `-${key}`;
  }

  return `${currentValue}${key}`;
}

export function NumericAnswerKeypad({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter numerical value',
}: NumericAnswerKeypadProps) {
  const handleKeyPress = (key: string) => {
    if (disabled) {
      return;
    }

    onChange(appendNumericKey(value, key));
  };

  const handleBackspace = () => {
    if (disabled) {
      return;
    }

    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) {
      return;
    }

    onChange('');
  };

  return (
    <div className="inline-flex flex-col items-start gap-2" style={{ width: '13rem' }}>
      <input
        type="text"
        value={value}
        readOnly
        inputMode="none"
        onKeyDown={(event) => event.preventDefault()}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg bg-white text-sm font-semibold text-gray-900"
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <div className="grid w-full grid-cols-3 gap-2">
        {NUMERIC_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyPress(key)}
            disabled={disabled}
            className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="col-span-2 w-full rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
