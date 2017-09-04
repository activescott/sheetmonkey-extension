- [x] Prerequisite to auth: Anytime the contentscripot asks for an extension list, first request a email address of the user.

# Allow plugins to call into smartsheet api w/out a backend #
* Requires the following general features:
    1. Helping plugin get authenticated (capturing the code and issuing a token)
    2. Working around cors

## Chrome Identity API ##

- [ ] Use [chrome.identity api](https://developer.chrome.com/extensions/identity) to capture code and get token from SS have the extension store it safely in background page.
    * References:
      * See https://developer.chrome.com/apps/app_identity#non
      * Identity api stores tokens safely
      * chrome://identity-internals/
    * Plan:
      * Plugin starts auth flow with extension (content) and content asks background to start auth flow via  [launchWebAuthFlow](https://developer.chrome.com/extensions/identity#method-launchWebAuthFlow).
      * Background Flow launches authflow to sheetmonkey.com, who uses the registered client_id & secret for the plugin to immediately redirect to smartsheet.com's OAuth endpoint.
      * Redirect from SS goes back to sheetmonkey.com, who catches the code, fetches a token, adds it to URL and redirects back to extension's 'https://<app-id>.chromiumapp.org/...' URL.
      * Extension catches the URL, extracts token from URL and saves token for that plugin (and user combo).
      * Later plugin can ask extension to call the API (extension gets around CORS) with a special API request (<verb> <relative_api_path>) and payload data. Extension will add appropriate auth header.
    - TASKS:
      - [x] Server: Allow devs to register client id, client secret, and redirect URL in sheetmonkey.com.
      - [x] Server: Setup auth endpoint that extension can use for authflow.
        - [x] Input is [pluginid, extension_redirect_uri], uses that to fetch clientid and redirect to ss.com auth endpoint.
        - [x] Upon auth, user is redirected back to sheetmonkey-server and he catches the code and uses plugin's registered client secret to get tokens and redirects to extension.
        - [ ] Extension: Catches tokens, saves them
        - [ ] Extension: When plugin reqeusts API operation, he uses saved tokens to auth API requests.
      
      - Later:
        - [ ] Token Refresh: To refresh tokens, sheetmonkey.com can just provide the service. Give the exntesion the refresh token too and let him manage it. Or ignore it, and when the token expires just spin up another auth flow.
        - [ ] Store tokens w/ app-fetched email address. Since extension could be in a browser that goes through one auth flow and gets a API token, then later the user logs out of app and logs in with a different user, we must attach each token to apluginID AND and user (email address).

* Modify CORS preflight response header to include the right allow-origin headers:
    * see `onHeadersReceived` at https://developer.chrome.com/extensions/webRequest . Can the allow-origin header be hacked there?



* Add https://developer.chrome.com/apps/analytics to extension /store listing
* - [x] fix the plugins insertion speed on the menu.
    - Use DomUtil.lazyQuerySelector to wait for the menu and trigger hooks. No more click monitoring and delays.
- [ ] Authenticate each plugin's calls back into the extension:
    - Once we start auth flow for API it will be important to authenticate the plugin calling into the extension so one plugin cannot start a flow using the client ID of another plugin and later, start making API calls using another plugin's client ID.
    - Plan:
        - When loading plugins in background, start generating a private/public key pair for each and caching it for the duration of the browser session.
        - When embedding each plugin into their sandbox frame in PluginHost, pluginHost inserts a private key into the page the way its already passing in other data with window properties (this is sandboxed frame so nobody can get to it but the plugin)
        - SheetMonkeyHost (inside plugin) can read the key and start signing the payload of message (e.g. the plugin URL or pluginID) with each message back to extension.
        - Extension validates authenticity of every plugin and adds pluginid to the message before passing it on. 
        - Tools:
            - JWT: Why not just start using JWT with the keys? Use claims in the JWT for command, params, and very short time-based expiration of JWT
                - NOTE there appear to be no relevant size limitationsin postMessage or JWT.
            - Alternate: https://w3c.github.io/webcrypto/Overview.html

- [ ] Sheet Command (copy permalink to clipboard)
- [ ] Row Command (copy permalink to clipboard)
- [ ] Col Command (get json)
- [ ] Col Indicators
- [ ] Row indicators
- [ ] SheetMonkeyHost.toast - Displays a toast message to the user with text.
