

// 设置插件图标为灰色
function SetIconDisable() {
    chrome.browserAction.setIcon({
        path: {
            "32": "../icons/gray_icon32.png",
            "48": "../icons/gray_icon48.png",
        }
    });
}

// 设置插件图标为原色
function SetIconEnable() {
    chrome.browserAction.setIcon({
        path: {
            "32": "../icons/icon32.png",
            "48": "../icons/icon48.png",
        }
    });
}

// 从插件的本地存储获取StFanyiDisable属性
chrome.storage.local.get(['StFanyiDisable'], res => {
    if (res.StFanyiDisable)
        SetIconDisable();
    else SetIconEnable();
});

// 监听StFanyiDisable属性的更改
chrome.storage.onChanged.addListener(changes => {
    if (changes.StFanyiDisable) {
        if (changes.StFanyiDisable.newValue)
            SetIconDisable();
        else SetIconEnable();
    }
});