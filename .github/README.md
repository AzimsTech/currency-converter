# Currency Converter 💱

Real-time currency converter using Bank Negara Malaysia exchange rates.

## CORS Handling

The BNM API doesn't support CORS for browser requests. A Cloudflare Worker acts as a secure proxy, restricted to authorized domains.

**Default endpoint:** 
```javascript
fetch('https://currency-converter.azimstech.workers.dev')
```

**Deploy your own:**

Create a Cloudflare Worker:

```javascript
export default {
  async fetch(request) {
    const allowedOrigins = [
      'https://username.github.io'
    ];

    const origin = request.headers.get('Origin');
    
    // Block if there's no origin OR if origin is not allowed
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = 'https://api.bnm.gov.my/public/exchange-rate';

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json',
      },
    });

    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
};
```

Update the worker URL in `fetchExchangeRates()` within `script.js`.

## BNM Open API

The app uses the conversion rate provided by Bank Negara Malaysia (BNM). The relevant documentation can be found [here][bnm-docs].

[bnm-docs]:https://apikijangportal.bnm.gov.my/
[corsproxy]:https://corsproxy.io/

> [!NOTE]
>  Exchange rates are not updated on BNM's non-working days (e.g., weekends and public holidays). During these times, the last available rate will be used.