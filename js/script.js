class CurrencyConverter {
    constructor() {
        this.exchangeRates = {};
        this.lastUpdated = '';
        this.isLoading = false;
        
        this.fromAmountInput = document.getElementById('fromAmount');
        this.toAmountInput = document.getElementById('toAmount');
        this.fromCurrencySelect = document.getElementById('fromCurrency');
        this.toCurrencySelect = document.getElementById('toCurrency');
        this.swapButton = document.getElementById('swapButton');
        this.resultSection = document.getElementById('resultSection');
        this.resultText = document.getElementById('resultText');
        this.rateInfo = document.getElementById('rateInfo');
        this.errorMessage = document.getElementById('errorMessage');
        this.lastUpdatedDiv = document.getElementById('lastUpdated');
        
        this.init();
    }
    
    async init() {
        await this.fetchExchangeRates();
        this.setupEventListeners();
        this.convert();
    }
    
    async fetchExchangeRates() {
        try {
            this.setLoading(true);
            this.hideError();

            const response = await fetch('https://corsproxy.io/?https://api.bnm.gov.my/public/exchange-rate', {
                headers: {
                    'Accept': 'application/vnd.BNM.API.v1+json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Initialize exchange rates with base MYR
            this.exchangeRates = { 'MYR': { buying_rate: 1, selling_rate: 1, middle_rate: 1 } };

            data.data.forEach(currency => {
                // BNM API does NOT return middle_rate — calculate it
                const buying = currency.rate.buying_rate;
                const selling = currency.rate.selling_rate;
                const middle = (buying + selling) / 2;

                const adjustedBuying = currency.unit === 100 ? buying / 100 : buying;
                const adjustedSelling = currency.unit === 100 ? selling / 100 : selling;
                const adjustedMiddle = currency.unit === 100 ? middle / 100 : middle;

                this.exchangeRates[currency.currency_code] = {
                    buying_rate: adjustedBuying,
                    selling_rate: adjustedSelling,
                    middle_rate: adjustedMiddle
                };
            });

            this.lastUpdated = data.meta.last_updated;
            this.updateLastUpdatedDisplay();
            this.populateCurrencyDropdowns();

        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            this.showError('Failed to fetch exchange rates. Please try again later.');
        } finally {
            this.setLoading(false);
        }
    }

    
    populateCurrencyDropdowns() {
        const currencies = Object.keys(this.exchangeRates).sort();
        
        // Clear existing options except MYR for fromCurrency
        this.fromCurrencySelect.innerHTML = '';
        this.toCurrencySelect.innerHTML = '';
        
        currencies.forEach(currency => {
            const option1 = new Option(currency, currency);
            const option2 = new Option(currency, currency);
            
            this.fromCurrencySelect.appendChild(option1);
            this.toCurrencySelect.appendChild(option2);
        });
        
        // Set default values
        this.fromCurrencySelect.value = 'USD';
        this.toCurrencySelect.value = 'MYR';
    }
    
    setupEventListeners() {
        this.fromAmountInput.addEventListener('input', () => this.convert());
        this.fromCurrencySelect.addEventListener('change', () => this.convert());
        this.toCurrencySelect.addEventListener('change', () => this.convert());
        this.swapButton.addEventListener('click', () => this.swapCurrencies());
        
        // Allow editing the "to" amount
        this.toAmountInput.addEventListener('input', () => this.reverseConvert());
    }
    
    convert() {
        const amount = parseFloat(this.fromAmountInput.value) || 0;
        const fromCurrency = this.fromCurrencySelect.value;
        const toCurrency = this.toCurrencySelect.value;
        
        if (amount === 0) {
            this.toAmountInput.value = '';
            this.hideResult();
            return;
        }
        
        const result = this.calculateConversion(amount, fromCurrency, toCurrency);
        this.toAmountInput.value = result.toFixed(2);
        this.displayResult(amount, fromCurrency, toCurrency, result);
    }
    
    reverseConvert() {
        const amount = parseFloat(this.toAmountInput.value) || 0;
        const fromCurrency = this.toCurrencySelect.value;
        const toCurrency = this.fromCurrencySelect.value;
        
        if (amount === 0) {
            this.fromAmountInput.value = '';
            this.hideResult();
            return;
        }
        
        const result = this.calculateConversion(amount, fromCurrency, toCurrency);
        this.fromAmountInput.value = result.toFixed(2);
        this.displayResult(parseFloat(this.fromAmountInput.value), this.fromCurrencySelect.value, this.toCurrencySelect.value, parseFloat(this.toAmountInput.value));
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
            // Already in MYR
            amountInMYR = amount;
        } else {
            // Convert foreign currency → MYR using correct rate (1 foreign = X MYR)
            amountInMYR = amount * fromRate.middle_rate;
        }

        let result;
        if (toCurrency === 'MYR') {
            // Result is in MYR
            result = amountInMYR;
        } else {
            // Convert MYR → foreign currency: divide by target rate
            result = amountInMYR / toRate.middle_rate;
        }

        return result;
    }
    
    displayResult(fromAmount, fromCurrency, toCurrency, toAmount) {
        this.resultText.textContent = `${fromAmount} ${fromCurrency} = ${toAmount.toFixed(2)} ${toCurrency}`;
        
        const rate = this.calculateConversion(1, fromCurrency, toCurrency);
        this.rateInfo.textContent = `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
        
        this.showResult();
    }
    
    swapCurrencies() {
        const tempCurrency = this.fromCurrencySelect.value;
        const tempAmount = this.fromAmountInput.value;
        
        this.fromCurrencySelect.value = this.toCurrencySelect.value;
        this.toCurrencySelect.value = tempCurrency;
        
        this.fromAmountInput.value = this.toAmountInput.value;
        
        this.convert();
    }
    
    showResult() {
        this.resultSection.style.display = 'block';
    }
    
    hideResult() {
        this.resultSection.style.display = 'none';
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
            this.lastUpdatedDiv.textContent = `BNM Open API - Last updated: ${date.toLocaleString()}`;
        }
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});