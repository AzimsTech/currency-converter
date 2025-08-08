# Currency Converter 💱

Real-time currency converter using Bank Negara Malaysia exchange rates.

## CORS Handling

The BNM API doesn't support CORS for browser requests, so this app uses [corsproxy.io][corsproxy] as a simple proxy solution.

```javascript
fetch('https://corsproxy.io/?https://api.bnm.gov.my/public/exchange-rate')
```
## BNM Open API

The app uses the conversion rate provided by Bank Negara Malaysia (BNM). The relevant documentation can be found [here][bnm-docs].

[bnm-docs]:https://apikijangportal.bnm.gov.my/
[corsproxy]:https://corsproxy.io/