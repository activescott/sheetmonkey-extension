# Allow plugins to call into smartsheet api w/out a backend #
* Requires the following general features:
    1. Helping plugin get authenticated (capturing the code and issuing a token)
    2. Working around cors

## ~~Plan A - Chrome Identity API - FAIL ##~~

* Use [chrome.identity api](https://developer.chrome.com/extensions/identity) to capture code and get token, store it safely.
    * See https://developer.chrome.com/apps/app_identity#non
    * Identity api stores tokens safely
    * Open Issues:
        * However doesn't look like refresh tokens will work for non-google apps. The getAuthToken seems to assume only google api's for refreshing (it never gives a chance to send the token request and doesn't have anywhere to register the token endpoint).
        * **client secret: Plugins will need the client secret to exchange the code for the token and sign the token request. No place for plugins to safely store the client secret. How do we keep it secret????**
    * NOTE: chrome://identity-internals/
    * Plan:
        * Start flow w/ [launchWebAuthFlow](https://developer.chrome.com/extensions/identity#method-launchWebAuthFlow).
        * Prerequisites for plugin:
            * Register extensions' redirect url (e.g. `https://<app-id>.chromiumapp.org/ss-oauth-callback-code-catcher`) as the redirect url.
* Modify CORS preflight response header to include the right allow-origin headers:
    * see `onHeadersReceived` at https://developer.chrome.com/extensions/webRequest . Can the allow-origin header be hacked there?

## Plan B - Custom Backend for "Public Clients" ##
* This technique implements two general areas of capability:
    1. A backend for authentication. 
    2. A backend to proxy calls to the REST API to avoid cors.
* NOTES: 
    * Authenticate the client by using a redirect URL to the chrome extension. The backend registeres itself as a the redirect URL with the Authorization server/OAuth API, but it redirects tokens to a URL only at the 
        It essentially is a standard OAuth backend (a confidential web application client on the backend) that can store the client secret.


* In this case each plugin maintains it's own backend for authentication
    * OR Can we use a specialized redirect URI to do some level of better authentication??
    * Open Issues: 
        * Need a way to client (browser/plugin) must authenticate the resource owner - https://tools.ietf.org/html/rfc6749#section-10.16
            * OAuth client types: https://tools.ietf.org/html/rfc6749#section-2.1



# FUTURE #
* Add https://developer.chrome.com/apps/analytics to extension /store listing
* - [x] fix the plugins insertion speed on the menu.
    - Use DomUtil.lazyQuerySelector to wait for the menu and trigger hooks. No more click monitoring and delays.
- [ ] Sheet Command (copy permalink to clipboard)
* Row Command (copy permalink to clipboard)
* Col Command (get json)
* Col Indicators
* Row indicators
* SheetMonkeyHost.toast - Displays a toast message to the user with text.
