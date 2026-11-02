const display = document.querySelector('#display');
const expression = document.querySelector('#expression');
const keypad = document.querySelector('.keypad');
const operatorButtons = [...document.querySelectorAll('[data-operator]')];

let currentValue = '0';
let storedValue = null;
let pendingOperator = null;
let shouldResetDisplay = false;
let hasError = false;

function render() {
  display.textContent = currentValue;
  expression.textContent = storedValue === null
    ? ''
    : `${formatNumber(storedValue)} ${operatorSymbol(pendingOperator ?? '')}`;
  operatorButtons.forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.operator === pendingOperator);
  });
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 10 });
}

function operatorSymbol(operator) {
  return ({ '/': '÷', '*': '×', '-': '−', '+': '+' })[operator] ?? '';
}

function inputDigit(digit) {
  if (hasError) clear();
  if (shouldResetDisplay) {
    currentValue = digit;
    shouldResetDisplay = false;
  } else if (currentValue === '0') {
    currentValue = digit;
  } else if (currentValue.length < 14) {
    currentValue += digit;
  }
  render();
}

function inputDecimal() {
  if (hasError) clear();
  if (shouldResetDisplay) {
    currentValue = '0.';
    shouldResetDisplay = false;
  } else if (!currentValue.includes('.')) {
    currentValue += '.';
  }
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function cleanResult(value) {
  if (!Number.isFinite(value)) return null;
  return Number.parseFloat(value.toPrecision(11)).toString();
}

function chooseOperator(operator) {
  if (hasError) clear();
  const value = Number(currentValue);

  if (pendingOperator && !shouldResetDisplay) {
    const result = cleanResult(calculate(Number(storedValue), value, pendingOperator));
    if (result === null) {
      showError();
      return;
    }
    currentValue = result;
    storedValue = result;
  } else {
    storedValue = currentValue;
  }

  pendingOperator = operator;
  shouldResetDisplay = true;
  render();
}

function showError() {
  currentValue = 'Error';
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = true;
  hasError = true;
  render();
}

function equals() {
  if (!pendingOperator || storedValue === null || hasError) return;
  const left = Number(storedValue);
  const right = Number(currentValue);
  const result = cleanResult(calculate(left, right, pendingOperator));
  if (result === null) {
    showError();
    return;
  }
  expression.textContent = `${formatNumber(left)} ${operatorSymbol(pendingOperator)} ${formatNumber(right)} =`;
  currentValue = result;
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = true;
  renderResult();
}

function renderResult() {
  display.textContent = currentValue;
  operatorButtons.forEach((button) => button.classList.remove('is-selected'));
}

function clear() {
  currentValue = '0';
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = false;
  hasError = false;
  render();
}

function backspace() {
  if (hasError || shouldResetDisplay) return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  if (currentValue === '-') currentValue = '0';
  render();
}

function toggleSign() {
  if (hasError) return;
  currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`;
  render();
}

function percent() {
  if (hasError) return;
  currentValue = cleanResult(Number(currentValue) / 100) ?? '0';
  shouldResetDisplay = false;
  render();
}

function handleAction(action) {
  if (action === 'clear') clear();
  if (action === 'backspace') backspace();
  if (action === 'decimal') inputDecimal();
  if (action === 'sign') toggleSign();
  if (action === 'percent') percent();
  if (action === 'equals') equals();
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) handleAction(button.dataset.action);
});

document.addEventListener('keydown', (event) => {
  if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
  else if (event.key === '.') inputDecimal();
  else if (['+', '-', '*', '/'].includes(event.key)) chooseOperator(event.key);
  else if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault();
    equals();
  } else if (event.key === 'Backspace') backspace();
  else if (event.key === 'Escape') clear();
  else if (event.key === '%') percent();
});

render();
