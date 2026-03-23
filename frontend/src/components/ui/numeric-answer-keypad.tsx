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
        className="theme-surface w-full rounded-lg border-2 px-3 py-2 text-sm font-semibold"
        style={{ borderColor: 'var(--state-warning-border)' }}
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
            className="theme-surface w-full rounded-lg border px-2 py-1.5 text-sm font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: 'var(--state-warning-border)' }}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          className="theme-surface w-full rounded-lg border px-2 py-1.5 text-[10px] font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: 'var(--state-warning-border)' }}
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="col-span-2 w-full rounded-lg border px-2 py-1.5 text-[10px] font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: 'var(--state-danger-border)', background: 'var(--state-danger-bg)', color: 'var(--state-danger-text)' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
