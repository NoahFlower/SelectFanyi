
// 前景色枚举
const FORECOLOR = {
    Default: "#FFF",
    Waiting: '#888',
    Warning: '#F55',
}


// 主体信息
var InfoForm = document.createElement('div');
InfoForm.style.opacity = '0';
InfoForm.style.position = 'fixed';
InfoForm.style.maxWidth = '30em';
InfoForm.style.padding = '10px';
InfoForm.style.borderRadius = '5px';
InfoForm.style.transition = 'opacity 0.25s';
InfoForm.style.boxShadow = '0 0 15px #222, 0 0 10px #000';
InfoForm.style.backgroundColor = 'rgba(15, 15, 15, 0.75)';
InfoForm.style.backdropFilter = 'blur(2px)';
InfoForm.style.zIndex = '100000';
document.body.appendChild(InfoForm);

// 注入回调函数脚本
var InjectScript = document.createElement('script');
InjectScript.innerText = `function StFanyi(res) { document.dispatchEvent(new CustomEvent("StFanyi", { detail: res })); }`;
InjectScript.type = "text/javascript";
document.head.appendChild(InjectScript);

var StFanyiDisable = false;
var StFanyiLocked = false;
var TimeoutResult = null;
var JsonpScript = null;


// 从插件的本地存储获取StFanyiDisable属性
chrome.storage.local.get(['StFanyiDisable'], res => StFanyiDisable = res ?? false);
chrome.storage.onChanged.addListener(changes => {
    if (changes.StFanyiDisable) StFanyiDisable = changes.StFanyiDisable.newValue;
});


// 移除文本中的空白字符
function RemoveWhiteSpace(text) {
    // 将连片的空白字符替换成一个空格，减少翻译使用
    return text.trim().replace(/\s+/g, ' ');
}

// 检查文本种是否包含较多中文字符
function ContainsChinese(text) {
    // 占比阈值 
    const PROPORTION_THRESHOLD = 0.2;

    // 统计文本中中文字符数量
    var numOfChineseChar = 0.0;
    for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        const SPAN1_MIN = 0x0021; // 符号 + 数字
        const SPAN1_MAX = 0x0040;
        const SPAN2_MIN = 0x005B; // 符号2
        const SPAN2_MAX = 0x0060;
        const SPAN3_MIN = 0x007B; // 符号3
        const SPAN3_MAX = 0x007E;
        const SPAN4_MIN = 0x4E00; // 中文字符
        const SPAN4_MAX = 0x9FA5;
        if (c >= SPAN1_MIN && c <= SPAN1_MAX ||
            c >= SPAN2_MIN && c <= SPAN2_MAX ||
            c >= SPAN3_MIN && c <= SPAN3_MAX ||
            c >= SPAN4_MIN && c <= SPAN4_MAX)
            numOfChineseChar++;
    }

    // 中文占比
    var proportion = numOfChineseChar / text.length;

    // 若超出阈值则返回true (例如中文字符占比超出20%就返回true)
    return proportion >= PROPORTION_THRESHOLD;
}

// 获取当前激活的界面元素是否是文本输入框
function ActivedInput() {
    // 文本框的内容不翻译
    var activeElementName =
        document.activeElement.nodeName;
    var result =
        activeElementName === 'INPUT' ||
        activeElementName === 'TEXTAREA';
    return result;
}

// 清除用户当前选中的内容
function ClearSelection() {
    if (StFanyiDisable) return;
    if (ActivedInput()) return;
    window.getSelection().
        removeAllRanges();
}

// 提示信息框
function TipInfo(text, forecolor) {
    InfoForm.innerText = text;
    InfoForm.style.opacity = '1';
    InfoForm.style.fontSize = '24px';
    InfoForm.style.color = forecolor;
    InfoForm.style.pointerEvents = 'auto';

    var left = (window.innerWidth - InfoForm.offsetWidth) / 2;
    var top = (window.innerHeight - InfoForm.offsetHeight) / 8 * 7;
    InfoForm.style.left = left + 'px';
    InfoForm.style.top = top + 'px';

    TimeoutResult && clearTimeout(TimeoutResult);
    TimeoutResult = setTimeout(() => {
        StFanyiLocked = false;
        TimeoutResult = null;
        HideInfo();
    }, 3000);
}

// 显示信息框
function ShowInfo(text, forecolor, pos = undefined) {

    if (StFanyiLocked) return;
    if (StFanyiDisable) return;

    InfoForm.innerText = text;
    InfoForm.style.opacity = '1';
    InfoForm.style.fontSize = '16px';
    InfoForm.style.color = forecolor;
    InfoForm.style.pointerEvents = 'auto';
    if (pos) {
        InfoForm.style.left = `${pos.x}px`;
        InfoForm.style.top = `${pos.y}px`;
    }
}

// 隐藏信息框
function HideInfo() {
    if (StFanyiLocked) return;
    InfoForm.style.opacity = '0';
    InfoForm.style.pointerEvents = 'none';
}

// 翻译结果的回调函数
function StFanyi(event) {
    var result = event.detail;
    StFanyiLocked = false;
    if (result.error_code) {
        var errorcode = result.error_code;
        var message = GetErrMsg(errorcode);
        ShowInfo(`翻译失败：${message}(${errorcode})`, FORECOLOR.Warning);
    }
    else ShowInfo(result.trans_result[0].dst, FORECOLOR.Default);
    JsonpScript.remove();
    JsonpScript = null;
}

// 键盘按下事件
function Keydown(event) {
    // 按下 Shift + E 
    if (event.shiftKey &&
        event.code === 'KeyE') {
        // 若用户正处于输入状态，阻止切换行为
        if (ActivedInput()) return;
        // 若插件正在翻译，阻止切换行为
        if (StFanyiLocked) {
            alert('请等待翻译完毕，或是刷新页面');
            return;
        }

        StFanyiDisable = !StFanyiDisable;
        if (StFanyiDisable)
            TipInfo('翻译已关闭', FORECOLOR.Warning);
        else TipInfo('翻译已开启', FORECOLOR.Default);
        chrome.storage.local.set({ StFanyiDisable: StFanyiDisable });
    }
}

// 鼠标弹起事件
function MouseUp(event) {

    if (StFanyiLocked) return;
    if (StFanyiDisable) return;
    if (ActivedInput()) return;
    if (InfoForm === event.target) return;

    // 获取用户在浏览器中选中的范围以及选中的文本（文本移除空白字符）
    var selected = window.getSelection();
    var selectedText = RemoveWhiteSpace(selected.toString());
    // 若用户并未选择任何内容，不进行翻译且隐藏提示框
    if (selectedText === '') {
        HideInfo();
        return;
    }

    // 选中内容的矩形区域
    var range = selected.getRangeAt(0);
    var rect = range.getBoundingClientRect();

    // 信息框显示位置
    var pos = {
        x: rect.left,
        y: rect.bottom + 10
    };

    // 若选中文本超出范围，不翻译
    if (rect.top < 0 ||
        rect.left < 0 ||
        rect.right > window.innerWidth ||
        rect.bottom > window.innerHeight) {
        TipInfo('超出可视范围', FORECOLOR.Warning);
        return;
    }

    // 若文本太长，不进行翻译
    if (selectedText.length >= 2000) {
        TipInfo('选中文本过长', FORECOLOR.Warning);
        return;
    }

    // 若包含较多中文字符，或文本太短，则不进行翻译
    if (selectedText.length <= 3 ||
        ContainsChinese(selectedText)) {
        ShowInfo(`${selectedText} (原文)`, FORECOLOR.Default, pos);
        return;
    }

    ShowInfo('正在翻译...', FORECOLOR.Waiting, pos);
    StFanyiLocked = true;

    var url = GetBdApiUrl(selectedText) + '&callback=StFanyi';
    JsonpScript = document.createElement('script');
    JsonpScript.src = url;
    document.head.appendChild(JsonpScript);
}

// 鼠标按下事件
function MouseDown(event) {
    if (event.target !== InfoForm) {
        ClearSelection();
        HideInfo();
    }
}

document.addEventListener('mousedown', MouseDown);
document.addEventListener('mouseup', MouseUp);
document.addEventListener('keydown', Keydown);
document.addEventListener('StFanyi', StFanyi);