
var BdCfg = {};
var appidElement = document.getElementById('appid');
var sckeyElement = document.getElementById('sckey');

chrome.storage.local.get(['BdCfg'], res => {
    BdCfg = res.BdCfg ?? {};
    appidElement.value = BdCfg.Appid ?? '';
    sckeyElement.value = BdCfg.Sckey ?? '';
    function BdCfgChanged() {
        BdCfg.Appid = appidElement.value ?? '';
        BdCfg.Sckey = sckeyElement.value ?? '';
        chrome.storage.local.set({ BdCfg: BdCfg });
    }
    appidElement.addEventListener('input', BdCfgChanged);
    sckeyElement.addEventListener('input', BdCfgChanged);
});