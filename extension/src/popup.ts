let serverUrl = '';
let serverAccessToken = '';
let roomId = '';

const $ = document.querySelector.bind(document);
const $serverUrlInput = $('#server-url')! as HTMLInputElement;
const $serverAccessTokenInput = $('#server-access-token')! as HTMLInputElement;
const $roomIdInput = $('#room-id')! as HTMLInputElement;
const $showSuggestionsButton = $('#show-suggestions')! as HTMLButtonElement;
const $shuffleSuggestionsButton = $('#shuffle-suggestions')! as HTMLButtonElement;

function updateUI() {
    const disabled = !serverUrl || !roomId;
    $showSuggestionsButton.disabled = disabled;
    $shuffleSuggestionsButton.disabled = disabled;
}

function saveOptions() {
    chrome.storage.sync.set({ 
        serverUrl, 
        serverAccessToken, 
        roomId
    });
}

function loadOptions() {
    chrome.storage.sync.get(['serverUrl', 'serverAccessToken', 'roomId'], function (result) {
        serverUrl = result.serverUrl || '';
        serverAccessToken = result.serverAccessToken || '';
        roomId = result.roomId || '';
        $serverUrlInput.value = serverUrl;
        $serverAccessTokenInput.value = serverAccessToken;
        $roomIdInput.value = roomId;
        updateUI();
    })
}

function updateServerUrl() {
    serverUrl = $serverUrlInput.value.replace(/\/$/, '');
    saveOptions();
    updateUI();
}

function updateServerAccessToken() {
    serverAccessToken = $serverAccessTokenInput.value;
    saveOptions();
}

function updateRoomId() {
    roomId = $roomIdInput.value;
    saveOptions();
    updateUI();
}

function sendShowSuggestionsMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
        if (id) {
            chrome.tabs.sendMessage(id, { type: 'show-suggestions' });
        }
    });
}

function sendShuffleSuggestionsRequest() {
    fetch(`${serverUrl}/room/${roomId}/powerups`, { 
        method: 'PATCH',
        headers: {
            'X-Access-Token': serverAccessToken,
        }
    });
}

~function init() {
    loadOptions();
    $serverUrlInput.addEventListener('input', updateServerUrl);
    $serverAccessTokenInput.addEventListener('input', updateServerAccessToken);
    $roomIdInput.addEventListener('input', updateRoomId);
    $showSuggestionsButton.addEventListener('click', sendShowSuggestionsMessage);
    $shuffleSuggestionsButton.addEventListener('click', sendShuffleSuggestionsRequest);
}();
