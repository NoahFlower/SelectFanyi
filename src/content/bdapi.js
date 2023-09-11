// 划词翻译使用的百度的API
// 页面首次加载，从Popup获取BdCfg

var BdCfg = {};

chrome.storage.local.get(['BdCfg'], res => BdCfg = res.BdCfg ?? {});

chrome.storage.onChanged.addListener(changes => {
    if (changes.BdCfg) BdCfg = changes.BdCfg.newValue;
});


// 通过百度API返回的错误码获取错误信息
function GetErrMsg(errorCode) {
    errorCode = JSON.parse(errorCode);
    switch (errorCode) {
        case 52001: return '请求超时，请重试';
        case 52002: return '系统错误，请重试';
        case 52003: return '未授权用户，请检查appid是否正确或者服务是否开通';
        case 54000: return '必填参数为空，请检查是否少传参数';
        case 54001: return '签名错误，请检查您的签名生成方法';
        case 54003: return '访问频率受限，请降低您的调用频率';
        case 54004: return '账户余额不足';
        case 54005: return '长query请求频繁，请降低长query的发送频率，3s后再试';
        case 58000: return '客户端IP非法';
        case 58001: return '译文语言方向不支持，检查译文语言是否在语言列表里';
        case 58002: return '服务当前已关闭';
        case 90107: return '认证未通过或未生效';
        default: return '未知错误';
    }
}

// 获取百度API URL
function GetBdApiUrl(query) {
    
    const API_URL = "https://api.fanyi.baidu.com/api/trans/vip/translate?";
    const API_FROM = 'en';
    const API_TO = 'zh';

    var salt = Math.round(Math.random() * 100000);
    var sign = MD5(BdCfg.Appid + query + salt + BdCfg.Sckey);

    var url = API_URL;
    url += "q=" + encodeURIComponent(query);
    url += "&from=" + API_FROM;
    url += "&to=" + API_TO;
    url += "&appid=" + BdCfg.Appid;
    url += "&salt=" + salt;
    url += "&sign=" + sign;

    return url;
}