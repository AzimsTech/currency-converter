class CurrencyConverter {
    constructor() {
        this.exchangeRates = {};
        this.lastUpdated = '';
        this.isLoading = false;
        this.targets = [];
        this.focusedTargetIndex = 0;

        this.currencyFlags = {
            'MYR': '🇲🇾',
            'USD': '🇺🇸',
            'EUR': '🇪🇺',
            'GBP': '🇬🇧',
            'JPY': '🇯🇵',
            'AUD': '🇦🇺',
            'CAD': '🇨🇦',
            'CHF': '🇨🇭',
            'CNY': '🇨🇳',
            'NZD': '🇳🇿',
            'SGD': '🇸🇬',
            'HKD': '🇭🇰',
            'KRW': '🇰🇷',
            'INR': '🇮🇳',
            'THB': '🇹🇭',
            'IDR': '🇮🇩',
            'PHP': '🇵🇭',
            'VND': '🇻🇳',
            'TWD': '🇹🇼',
            'AED': '🇦🇪',
            'SAR': '🇸🇦',
            'EGP': '🇪🇬',
            'PKR': '🇵🇰',
            'NPR': '🇳🇵',
            'MMK': '🇲🇲',
            'KHR': '🇰🇭',
            'BND': '🇧🇳',
            'SDR': '🏳️',
        };

        this.fromAmountInput = document.getElementById('fromAmount');
        this.fromCurrencySelect = document.getElementById('fromCurrency');
        this.swapButton = document.getElementById('swapButton');
        this.targetsContainer = document.getElementById('targetsContainer');
        this.addTargetSelect = document.getElementById('addTargetSelect');
        this.errorMessage = document.getElementById('errorMessage');
        this.lastUpdatedDiv = document.getElementById('lastUpdated');

        this.init();
    }

    async init() {
        await this.fetchExchangeRates();
        this.setupEventListeners();
        this.restoreTargets();
        this.focusAndSelect(this.fromAmountInput);
    }

    async fetchExchangeRates() {
        try {
            this.setLoading(true);
            this.hideError();

            const response = await fetch('https://currency-converter.azimstech.workers.dev', {
                headers: { 'Accept': 'application/vnd.BNM.API.v1+json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            this.exchangeRates = { 'MYR': { buying_rate: 1, selling_rate: 1, middle_rate: 1 } };

            data.data.forEach(currency => {
                const buying = currency.rate.buying_rate;
                const selling = currency.rate.selling_rate;
                const middle = (buying + selling) / 2;
                const unit = currency.unit === 100 ? 100 : 1;
                this.exchangeRates[currency.currency_code] = {
                    buying_rate: buying / unit,
                    selling_rate: selling / unit,
                    middle_rate: middle / unit
                };
            });

            this.lastUpdated = data.meta.last_updated;
            this.updateLastUpdatedDisplay();
            this.populateFromCurrencyDropdown();

        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            this.showError('Failed to fetch exchange rates. Please try again later.');
        } finally {
            this.setLoading(false);
        }
    }

    getSortedCurrencies() {
        return Object.keys(this.exchangeRates).sort();
    }

    populateAddTargetSelect() {
        const selected = new Set(this.targets.map(t => t.currencySelect.value));
        selected.add(this.fromCurrencySelect.value);

        this.addTargetSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '+ Add target currency';
        this.addTargetSelect.appendChild(placeholder);

        this.getSortedCurrencies().forEach(c => {
            if (selected.has(c)) return;
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = this.getCurrencyDisplayText(c);
            this.addTargetSelect.appendChild(opt);
        });
    }

    getCurrencyDisplayText(currencyCode) {
        const flag = this.currencyFlags[currencyCode] || '🏳️';
        return `${flag} ${currencyCode}`;
    }

    populateFromCurrencyDropdown() {
        const currencies = this.getSortedCurrencies();
        this.fromCurrencySelect.innerHTML = '';
        currencies.forEach(currency => {
            this.fromCurrencySelect.appendChild(new Option(this.getCurrencyDisplayText(currency), currency));
        });
        this.fromCurrencySelect.value = localStorage.getItem('fromCurrency') || 'USD';
    }

    setupEventListeners() {
        this.fromAmountInput.addEventListener('input', () => this.convertAll());
        this.fromCurrencySelect.addEventListener('change', () => {
            this.convertAll();
            localStorage.setItem('fromCurrency', this.fromCurrencySelect.value);
            this.populateAddTargetSelect();
        });
        this.swapButton.addEventListener('click', () => this.swapCurrencies());
        this.addTargetSelect.addEventListener('change', () => {
            const value = this.addTargetSelect.value;
            if (!value) return;
            this.addTarget(value);
            this.addTargetSelect.value = '';
            this.saveTargetState();
            this.populateAddTargetSelect();
        });
    }

    restoreTargets() {
        const count = parseInt(localStorage.getItem('targetCount')) || 1;
        for (let i = 0; i < count; i++) {
            const savedCurrency = localStorage.getItem(`toCurrency_${i}`);
            this.addTarget(savedCurrency || undefined);
        }
        this.saveTargetState();
        this.populateAddTargetSelect();
    }

    addTarget(currencyCode) {
        const index = this.targets.length;
        const currencies = this.getSortedCurrencies();

        const row = document.createElement('div');
        row.className = 'target-row';

        const inputGroup = document.createElement('div');
        inputGroup.className = 'currency-input-group';

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'currency-input to-amount';
        amountInput.placeholder = '0';
        amountInput.inputMode = 'decimal';

        const currencySelect = document.createElement('select');
        currencySelect.className = 'currency-select to-currency';
        currencies.forEach(c => {
            currencySelect.appendChild(new Option(this.getCurrencyDisplayText(c), c));
        });

        const defaultCurrency = currencyCode || (index === 0 ? 'MYR' : 'USD');
        const validCurrency = currencies.includes(defaultCurrency) ? defaultCurrency : currencies[0];
        currencySelect.value = validCurrency;

        const rateDiv = document.createElement('div');
        rateDiv.className = 'target-rate';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-target-btn';
        removeBtn.setAttribute('aria-label', 'Remove target currency');
        removeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';

        inputGroup.appendChild(amountInput);
        inputGroup.appendChild(currencySelect);
        inputGroup.appendChild(removeBtn);
        row.appendChild(inputGroup);
        row.appendChild(rateDiv);
        this.targetsContainer.appendChild(row);

        const target = { amountInput, currencySelect, rateDiv, removeBtn, row };
        this.targets.push(target);

        amountInput.addEventListener('input', () => this.reverseConvert(this.targets.indexOf(target)));
        amountInput.addEventListener('focus', () => { this.focusedTargetIndex = this.targets.indexOf(target); });
        currencySelect.addEventListener('change', () => {
            this.convertAll();
            this.saveTargetState();
            this.populateAddTargetSelect();
        });
        removeBtn.addEventListener('click', () => this.removeTarget(this.targets.indexOf(target)));

        this.updateRemoveButtons();
        this.convertAll();
        this.populateAddTargetSelect();
    }

    removeTarget(index) {
        if (this.targets.length <= 1) return;
        const target = this.targets[index];
        target.row.remove();
        this.targets.splice(index, 1);
        if (this.focusedTargetIndex >= this.targets.length) {
            this.focusedTargetIndex = this.targets.length - 1;
        }
        this.updateRemoveButtons();
        this.convertAll();
        this.saveTargetState();
        this.populateAddTargetSelect();
    }

    updateRemoveButtons() {
        const show = this.targets.length > 1;
        this.targets.forEach((t) => {
            t.removeBtn.style.display = show ? '' : 'none';
        });
    }

    swapCurrencies() {
        const targetIndex = this.focusedTargetIndex;
        const target = this.targets[targetIndex];
        if (!target) return;

        const temp = this.fromCurrencySelect.value;
        this.fromCurrencySelect.value = target.currencySelect.value;
        target.currencySelect.value = temp;

        localStorage.setItem('fromCurrency', this.fromCurrencySelect.value);
        this.saveTargetState();
        this.convertAll();
        this.populateAddTargetSelect();
        this.focusAndSelect(this.fromAmountInput);
    }

    convertAll() {
        const fromAmount = parseFloat(this.fromAmountInput.value) || 0;
        const fromCurrency = this.fromCurrencySelect.value;

        this.targets.forEach((target) => {
            const toCurrency = target.currencySelect.value;
            if (fromAmount === 0) {
                target.amountInput.value = '';
                target.rateDiv.textContent = '';
                return;
            }
            const result = this.calculateConversion(fromAmount, fromCurrency, toCurrency);
            target.amountInput.value = result.toFixed(2);
            const rate = this.calculateConversion(1, fromCurrency, toCurrency);
            target.rateDiv.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        });
    }

    reverseConvert(index) {
        const target = this.targets[index];
        const amount = parseFloat(target.amountInput.value) || 0;
        const fromCurrency = target.currencySelect.value;
        const toCurrency = this.fromCurrencySelect.value;

        if (amount === 0) {
            this.fromAmountInput.value = '';
            this.convertAll();
            return;
        }

        const result = this.calculateConversion(amount, fromCurrency, toCurrency);
        this.fromAmountInput.value = result.toFixed(2);
        this.convertAll();
    }

    calculateConversion(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const fromRate = this.exchangeRates[fromCurrency];
        const toRate = this.exchangeRates[toCurrency];

        if (!fromRate || !toRate) {
            return 0;
        }

        let amountInMYR;
        if (fromCurrency === 'MYR') {
            amountInMYR = amount;
        } else {
            amountInMYR = amount * fromRate.middle_rate;
        }

        let result;
        if (toCurrency === 'MYR') {
            result = amountInMYR;
        } else {
            result = amountInMYR / toRate.middle_rate;
        }

        return result;
    }

    saveTargetState() {
        this.targets.forEach((t, i) => {
            localStorage.setItem(`toCurrency_${i}`, t.currencySelect.value);
        });
        localStorage.setItem('targetCount', this.targets.length);
        for (let i = this.targets.length; ; i++) {
            if (localStorage.getItem(`toCurrency_${i}`) === null) break;
            localStorage.removeItem(`toCurrency_${i}`);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    setLoading(loading) {
        this.isLoading = loading;
        document.body.classList.toggle('loading', loading);
    }

    updateLastUpdatedDisplay() {
        if (this.lastUpdated) {
            const date = new Date(this.lastUpdated);
            const locale = navigator.language === 'en' ? 'en-MY' : navigator.language;
            this.lastUpdatedDiv.textContent = `BNM Open API - Last updated: ${date.toLocaleString(locale)}`;
        }
    }

    focusAndSelect(el) {
        el.focus();
        setTimeout(() => el.select(), 0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});
