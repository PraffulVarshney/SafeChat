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
var roomId = '10000'; // Default room
var roomPassword = '10000'

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
        alert('Please enter a username.');
        return;
    }

    const words = username.split(' ');

    // Check each word in the username for abuse
    try {
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                alert('Please choose another username.');
                return; // Exit early if abusive word is found
            }
        }

        // If we reach here, no abusive words were found
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', '10000');
        sessionStorage.setItem('roomPassword', '10000');
        roomIdArea.textContent = `Chat Room Id - Global`;

        roomId = '10000';

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        stompClient.connect({}, () => onConnected(false), onError);

    } catch (error) {
        console.error("Error checking abuse word:", error);
        alert('Error validating username. Please try again.');
    }
}

function onConnected(isReload = false, roomNumber = '10000', roomPassword = '10000') {
    roomId = roomNumber;
    console.log("roomId: ", roomId)
    console.log("roomPassword: ", roomPassword)

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
                var timestamp = new Date().getTime();
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

        })
        .catch(error => {
            console.log("Error fetching previous messages:", error);
            alert("Please provide correct Room Id and Password.");

            sessionStorage.removeItem('username');
            sessionStorage.removeItem('roomId');
            sessionStorage.removeItem('roomPassword');

            // Reset to username page on error
            chatPage.classList.add('hidden');
            usernamePage.classList.remove('hidden');
            connectingElement.classList.remove('hidden');
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
        var timestamp = new Date().getTime();
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
    roomId = '10000';
    roomPassword = '10000';


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
        alert('Please enter a username.');
        return;
    }

    // Check username for abuse before creating room
    try {
        const words = username.split(' ');
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                alert('Please choose another username.');
                return;
            }
        }
    } catch (error) {
        console.error("Error checking abuse word:", error);
        alert('Error validating username. Please try again.');
        return;
    }

    const roomPassword = prompt('Please create the password for your room.');
    if(roomPassword === null) {
        return;
    }
    if (!roomPassword || roomPassword.trim() === "") {
        alert('Password cannot be empty.');
        return;
    }

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

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', currentRoomId);
        sessionStorage.setItem('roomPassword', roomPassword);
        roomIdArea.textContent = `Chat Room Id - ${currentRoomId}`;

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            onConnected(false, currentRoomId, roomPassword.trim());
        }, onError);

    } catch (err) {
        console.error('Error:', err);
        alert('Error creating room.');
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
        alert('Please enter a username.');
        return;
    }

    // Check username for abuse before joining room
    try {
        const words = username.split(' ');
        for (const word of words) {
            const isAbusive = await checkAbuseWord(word);
            if (isAbusive) {
                alert('Please choose another username.');
                return;
            }
        }
    } catch (error) {
        console.error("Error checking abuse word:", error);
        alert('Error validating username. Please try again.');
        return;
    }

    const roomDetails = await getRoomDetails();
    if (!roomDetails) {
        console.log('User cancelled');
        return;
    }

    const { roomId: targetRoomId, roomPassword } = roomDetails;
    console.log('Room ID:', targetRoomId);
    console.log('Password:', roomPassword);

    try {
        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            onConnected(false, targetRoomId, roomPassword);
        }, onError);

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomId', targetRoomId);
        sessionStorage.setItem('roomPassword', roomPassword);
        roomIdArea.textContent = `Chat Room Id - ${targetRoomId}`;

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');


    } catch (err) {
        console.error('Error:', err);
        alert('Error joining room.');
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
    if(savedRoomNameTemp === '10000') {
        savedRoomNameTemp = 'Global'
    }
    roomIdArea.textContent = `Chat Room Id - ${savedRoomNameTemp}`;

    if (savedUsername) {
        username = savedUsername;
        roomId = savedRoomName || '10000';
        roomPassword = savedRoomPassword || '10000';
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        stompClient.connect({}, () => onConnected(true, roomId, roomPassword), onError);
    }
};

function snowfall(msgLen) {
    const snowflakeCount = Math.min(msgLen * 10, 500);
    const snowflakeContainer = snowFall;

    if (!snowflakeContainer) return; // Safety check

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

async function getRoomDetails() {
    const result = await Swal.fire({
        title: 'Enter Room Details',
        html: `
            <input id="swal-room-id" class="swal2-input" placeholder="Room ID">
            <input id="swal-room-password" type="password" class="swal2-input" placeholder="Room Password">
        `,
        focusConfirm: false,
        preConfirm: () => {
            const roomId = document.getElementById('swal-room-id').value.trim();
            const roomPassword = document.getElementById('swal-room-password').value.trim();

            if (!roomId || !roomPassword) {
                Swal.showValidationMessage('Please enter both Room ID and Password');
                return false;
            }

            return { roomId, roomPassword };
        }
    });

    if (result.isConfirmed) {
        return result.value;
    }

    return null;
}