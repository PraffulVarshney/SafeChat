'use strict';
import loadingMsg from "./loadingMsg.js";

var roomIdArea = document.querySelector('.chat-header h2')
var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var messageExit = document.querySelector('#exit');
var snowFall = document.querySelector('.snowflakes-container')

var createRoomButton = document.querySelector('.create-room');
var joinRoomButton = document.querySelector('.join-room');

var stompClient = null;
var username = null;
var roomId = '1000'; // Default room
var roomPassword = '1000'

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

async function connect(event) {
    event.preventDefault();

    if (event.submitter.value !== 'start') {
        return;
    }
    loadingMsgs();
    username = document.querySelector('#name').value.trim();

    if (!username) {
        showError('Please enter a username.');
        return;
    }

    const words = username.split(' ');

    showLoader('Checking Username...');
    // Check each word in the username for abuse
    try {
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                hideLoader();
                showError('Please choose another username.');
                return; // Exit early if abusive word is found
            }
        }
        showLoader('Joining chat...');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        // Wait for connection to complete
        await new Promise((resolve, reject) => {
            stompClient.connect({}, () => {
                onConnected(false)
                    .then(() => resolve(true))
                    .catch(error => reject(error));
            }, reject);
        });

        // If we reach here, no abusive words were found
        hideLoader();
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', '1000');
        sessionStorage.setItem('roomPassword', '1000');
        roomIdArea.textContent = `Room Id - Global`;

        roomId = '1000';

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');


    } catch (error) {
        hideLoader();
        console.error("Error checking abuse word:", error);
        showError('Error connecting. Please try again.');

        if (stompClient) {
            stompClient.disconnect();
            stompClient = null;
        }
    }
}

function onConnected(isReload = false, roomNumber = '1000', roomPassword = '1000') {
    return new Promise((resolve, reject) => {
        roomId = roomNumber;
        console.log("roomId: ", roomId)
        console.log("roomPassword: ", roomPassword)

        showLoader('Loading chats...');
        fetch(`/rooms/${roomId}/messages?password=${roomPassword}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Invalid room or password");
                }
                return response.json();
            })
            .then(messages => {
                console.log(`Fetching messages for room ${roomId}:`, messages.length);
                messageArea.innerHTML = '';
                messages.forEach(message => {
                    var payload = {
                        body: JSON.stringify(message)
                    };
                    onMessageReceived(payload);
                });

                // Send a "user joined" message only if it's not a reload
                if (!isReload) {
                    const timestamp = new Date().getTime();
                    var chatMessage = {
                        sender: username,
                        content: `${username} joined!`,
                        type: 'JOIN',
                        timestamp: timestamp,
                        roomId: roomId
                    };
                    stompClient.send(`/app/room/${roomId}/addUser`, {}, JSON.stringify(chatMessage));
                }

                connectingElement.classList.add('hidden');
                // Subscribe to the room topic
                stompClient.subscribe(`/topic/room/${roomId}`, onMessageReceived);

                // Resolve the Promise on success
                hideLoader();
                resolve();
            })
            .catch(error => {
                hideLoader();
                console.log("Error fetching previous messages:", error);
//                showError("Please provide correct Room Id and Password.");

                sessionStorage.removeItem('username');
                sessionStorage.removeItem('roomId');
                sessionStorage.removeItem('roomPassword');

                // Reset to username page on error
                chatPage.classList.add('hidden');
                usernamePage.classList.remove('hidden');
                connectingElement.classList.remove('hidden');

                // Reject the Promise with the error
                reject(error);
            });
    });
}

function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    event.preventDefault();

    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        const timestamp = new Date().getTime();
        var chatMessage = {
            sender: username,
            content: messageContent, // Use trimmed content
            type: 'CHAT',
            timestamp: timestamp,
            roomId: roomId // Use current roomId instead of sessionStorage
        };
        console.log(`Sending message to room ${roomId}:`, chatMessage);
        stompClient.send(`/app/room/${roomId}/sendMessage`, {}, JSON.stringify(chatMessage));
        snowfall(messageContent.length);
        messageInput.value = '';
    }
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    console.log('payload', payload);

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);



        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function loadingMsgs() {
    const randomIndex = Math.floor(Math.random() * loadingMsg.length);
    let message = loadingMsg[randomIndex];
    connectingElement.innerText = message;
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function exitChat(event) {
    event.preventDefault();

    var savedUsername = username || sessionStorage.getItem("username");
    var currentRoomId = roomId || sessionStorage.getItem("roomId");
    var currentRoomPassword = roomPassword || sessionStorage.getItem("roomPassword");

    // Send leave message before disconnecting
    if (stompClient && savedUsername && currentRoomId) {
        var timestamp = new Date().getTime();
        var chatMessage = {
            sender: savedUsername,
            content: `${savedUsername} left!`,
            type: 'LEAVE',
            timestamp: timestamp,
            roomId: currentRoomId
        };

        stompClient.send(`/app/room/${currentRoomId}/leaveUser`, {}, JSON.stringify(chatMessage));

        // Disconnect after sending leave message
        stompClient.disconnect(() => {
            console.log('Disconnected from server');
        });
        stompClient = null;
    }

    // Clear storage and reset variables
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('roomPassword');
    username = null;
    roomId = '1000';
    roomPassword = '1000';


    // Clear chat messages
    messageArea.innerHTML = '';

    // Reset UI
    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');
    connectingElement.classList.remove('hidden');
}

async function createRoom(event) {
    event.preventDefault();

    const nameInput = document.querySelector('#name');
    if (!nameInput.checkValidity()) {
        nameInput.reportValidity();
        return;
    }

    username = nameInput.value.trim();
    if (username === '') {
        showError('Please enter a username.');
        return;
    }

    showLoader('Checking username...');
    // Check username for abuse before creating room
    try {
        const words = username.split(' ');
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                hideLoader();
                showError('Please choose another username.');
                return;
            }
        }
    } catch (error) {
        hideLoader();
        console.error("Error checking abuse word:", error);
        showError('Error validating username. Please try again.');
        return;
    }

    hideLoader();
    //const roomPassword = prompt('Please create the password for your room.');
    const roomPassword = await showPrompt(
        'Please create the password for your room.',
        'Enter password...',
        'password'  // Makes it a password input
    );
    if(roomPassword === null) {
        return;
    }
    if (!roomPassword || roomPassword.trim() === "") {
        showError('Password cannot be empty.');
        return;
    }

    showLoader('Creating room...');
    try {
        const response = await fetch(`/createRoom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: roomPassword.trim() })
        });

        if (!response.ok) {
            console.log('response', response);
            throw new Error('Room creation failed');
        }

        const data = await response.json();
        console.log('data', data);
        const currentRoomId = data.roomId;

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

       // Wait for connection AND room validation
        await new Promise((resolve, reject) => {
            stompClient.connect({}, function () {
                onConnected(false, currentRoomId, roomPassword.trim())
                    .then(() => resolve(true))
                    .catch(error => reject(error));
            }, onError);
        });

        hideLoader();
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', currentRoomId);
        sessionStorage.setItem('roomPassword', roomPassword);
        roomIdArea.textContent = `Room Id - ${currentRoomId}`;

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

    } catch (err) {
        hideLoader();
        console.error('Error:', err);
        showError('Error creating room: ' + err.message);
//        showError('Error creating room.');
        if (stompClient) {
            stompClient.disconnect();
            stompClient = null;
        }
    }
}

async function joinRoom(event) {
    event.preventDefault();
    const nameInput = document.querySelector('#name');
    if (!nameInput.checkValidity()) {
        nameInput.reportValidity();
        return;
    }

    username = nameInput.value.trim();
    if (username === '') {
        showError('Please enter a username.');
        return;
    }

    showLoader('Checking username...');
    // Check username for abuse before joining room
    try {
        const words = username.split(' ');
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                hideLoader();
                showError('Please choose another username.');
                return;
            }
        }
    } catch (error) {
        hideLoader();
        console.error("Error checking abuse word:", error);
        showError('Error validating username. Please try again.');
        return;
    }

    hideLoader();
    const roomDetails = await getRoomDetails();
    if (!roomDetails) {
        hideLoader();
        console.log('User cancelled');
        return;
    }

    const { roomId: targetRoomId, roomPassword } = roomDetails;
    console.log('Room ID:', targetRoomId);
    console.log('Password:', roomPassword);

    showLoader('Joining room...');
    try {
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

       // Create a Promise to handle the connection result
        const connectionResult = await new Promise((resolve, reject) => {
            stompClient.connect({},
                function () {
                    // Connection successful, now try to join the room
                    onConnected(false, targetRoomId, roomPassword)
                        .then(() => resolve(true))
                        .catch(error => reject(error));
                },
                function(error) {
                    // Connection failed
                    reject(new Error('WebSocket connection failed: ' + error));
                }
            );
        });``

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', targetRoomId);
        sessionStorage.setItem('roomPassword', roomPassword);
        roomIdArea.textContent = `Room Id - ${targetRoomId}`;
        hideLoader();
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

    } catch (err) {
        hideLoader();
        console.error('Error:', err);
        //showError('Error joining room.');
        showError('Error joining room: ' + err.message);
        // Clean up on error
        if (stompClient) {
            stompClient.disconnect();
            stompClient = null;
        }
    }
}

// Event listeners
usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
messageExit.addEventListener('click', exitChat, true);
createRoomButton.addEventListener('click', createRoom);
joinRoomButton.addEventListener('click', joinRoom);

window.onload = function () {
    loadingMsgs();
    const savedUsername = sessionStorage.getItem('username');
    const savedRoomName = sessionStorage.getItem('roomId');
    const savedRoomPassword = sessionStorage.getItem('roomPassword');
    var savedRoomNameTemp = savedRoomName
    if(savedRoomNameTemp === '1000') {
        savedRoomNameTemp = 'Global'
    }
    roomIdArea.textContent = `Room Id - ${savedRoomNameTemp}`;

    if (savedUsername) {
        username = savedUsername;
        roomId = savedRoomName || '1000';
        roomPassword = savedRoomPassword || '1000';
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
//        stompClient.connect({}, () => onConnected(true, roomId, roomPassword), onError);
        stompClient.connect({}, () => {
            onConnected(true, roomId, roomPassword).catch(error => {
                console.error("Connection error:", error);
                onError(error);
            });
        }, onError);

    }
};

function snowfall(msgLen) {
    const snowflakeCount = Math.min(msgLen * 1, 500);
    const snowflakeContainer = snowFall;

    if (!snowflakeContainer) {
        console.warn('Snowfall container not found');
        return; // Safety check
    }

    snowflakeContainer.replaceChildren();

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');

        // Randomize size (between 20px and 30px)
        const size = Math.random() * 10 + 20;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;

        // Randomize left position (between 0% and 100% of the viewport width)
        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.top = `-${Math.random() * 80}vw`;

        // Randomize animation duration (between 10s and 13s)
        const randomSpeed = Math.random() * 3 + 10;
        snowflake.style.animationDuration = `${randomSpeed}s`;

        snowflakeContainer.appendChild(snowflake);
    }
}

async function checkAbuseWord(word) {
    try {
        const response = await fetch(`/api/abuse/search/${encodeURIComponent(word)}`);
        if (response.ok) {
            const isAbusive = await response.json();
            console.log(`Is abusive: ${isAbusive}`);
            return isAbusive;
        } else {
            console.error('Error checking word:', response.statusText);
            return false; // Default to false on error
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return false; // Default to false on error
    }
}

function getRoomDetails() {
    return new Promise((resolve) => {
        const modal = document.getElementById('roomModal');
        const roomIdInput = document.getElementById('roomIdInput');
        const roomPasswordInput = document.getElementById('roomPasswordInput');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');
        const roomIdError = document.getElementById('roomIdError');
        const roomPasswordError = document.getElementById('roomPasswordError');

        // Clear inputs and errors
        roomIdInput.value = '';
        roomPasswordInput.value = '';
        clearErrors();

        // Show modal
        modal.classList.add('show');
        setTimeout(() => roomIdInput.focus(), 100);

        function clearErrors() {
            roomIdInput.classList.remove('error');
            roomPasswordInput.classList.remove('error');
            roomIdError.classList.add('hidden');
            roomPasswordError.classList.add('hidden');
        }

        function validateInputs() {
            clearErrors();
            let isValid = true;

            const roomId = roomIdInput.value.trim();
            const roomPassword = roomPasswordInput.value.trim();

            if (!roomId) {
                roomIdInput.classList.add('error');
                roomIdError.textContent = 'Room ID is required';
                roomIdError.classList.remove('hidden');
                isValid = false;
            }

            if (!roomPassword) {
                roomPasswordInput.classList.add('error');
                roomPasswordError.textContent = 'Room Password is required';
                roomPasswordError.classList.remove('hidden');
                isValid = false;
            }

            return isValid ? { roomId, roomPassword } : null;
        }

        confirmBtn.onclick = () => {
            const result = validateInputs();
            if (result) {
                modal.classList.remove('show');
                resolve(result);
            }
        };

        cancelBtn.onclick = () => {
            modal.classList.remove('show');
            resolve(null);
        };

        // Enter key support
        [roomIdInput, roomPasswordInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') confirmBtn.click();
            });
        });
    });
}

function showPrompt(title, placeholder = '', inputType = 'text') {
    return new Promise((resolve) => {
        const modal = document.getElementById('inputModal');
        const titleElement = document.getElementById('inputModalTitle');
        const input = document.getElementById('singleInput');
        const cancelBtn = document.getElementById('inputCancelBtn');
        const confirmBtn = document.getElementById('inputConfirmBtn');
        const errorDiv = document.getElementById('singleInputError');

        // Set up modal
        titleElement.textContent = title;
        input.type = inputType;
        input.placeholder = placeholder;
        input.value = '';
        input.classList.remove('error');
        errorDiv.classList.add('hidden');

        // Show modal
        modal.classList.add('show');
        setTimeout(() => input.focus(), 100);

        // Handle confirm
        confirmBtn.onclick = () => {
            const value = input.value.trim();
            if (!value) {
                input.classList.add('error');
                errorDiv.textContent = 'This field is required';
                errorDiv.classList.remove('hidden');
                return;
            }
            modal.classList.remove('show');
            resolve(value);
        };

        // Handle cancel
        cancelBtn.onclick = () => {
            modal.classList.remove('show');
            resolve(null);
        };

        // Handle Enter/Escape keys
        function handleEnter(e) {
            if (e.key === 'Enter') confirmBtn.click();
        }
        function handleEscape(e) {
            if (e.key === 'Escape') cancelBtn.click();
        }

        input.addEventListener('keypress', handleEnter);
        document.addEventListener('keydown', handleEscape);

        // Cleanup
        const originalResolve = resolve;
        resolve = (value) => {
            input.removeEventListener('keypress', handleEnter);
            document.removeEventListener('keydown', handleEscape);
            originalResolve(value);
        };
    });
}

// Helper functions
function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#f44336"
    }).showToast();
}

// Generic function to show/hide main loader
function showLoader(message = 'Loading...') {
    const loader = document.getElementById('mainLoader');
    const loaderText = document.getElementById('loaderText');
    loaderText.textContent = message;
    loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('mainLoader');
    loader.classList.add('hidden');
}