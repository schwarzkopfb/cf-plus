function hidePopupBasedOnUrl(tab: chrome.tabs.Tab): void {
    const { id, url } = tab;

    if (!url) {
        return;
    }

    const match = url?.indexOf('curvefever.pro');

    if (id && (!match || match < 0)) {
        chrome.action.disable(id);
    }
}

function getActiveTab(callback: (tab: chrome.tabs.Tab) => void): void {
    const retry = () => {
        const err = chrome.runtime.lastError;

        // It's safe to ignore this error and retry a bit later.
        // Ref #1: https://stackoverflow.com/a/67905854
        // Ref #2: https://stackoverflow.com/a/28432087
        if (err?.message === 'Tabs cannot be queried right now (user may be dragging a tab).')
            // We only need to make an async dispatch here (re-schedule the call in the browser's event loop),
            // so the 1ms delay is ok.
            setTimeout(() => getActiveTab(callback), 1);
        else
            console.error(err);
    }

    chrome.tabs.query(
        {
            active: true,
            lastFocusedWindow: true
        },
        tabs => {
            if (tabs !== undefined) {
                const [tab] = tabs;

                if (tab !== undefined)
                    callback(tab);
                else
                    retry();
            }
            else
                retry();
        }
    );
}

~function init() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
        hidePopupBasedOnUrl(tab)
    );

    chrome.tabs.onActivated.addListener(() =>
        getActiveTab(hidePopupBasedOnUrl)
    );
}();
