'use strict';
import loadingMsg from "./loadingMsg.js";

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

var stompClient = null;
var username = null;
var roomId = '10000'; // Default room

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    if (event.submitter.value !== 'start') {
        return;
    }
    loadingMsgs();

    username = document.querySelector('#name').value.trim();    
    const words = username.split(' ');

    // Check each word in the username for abuse
    let isAbusive = false;
    for (const word of words) {
        checkAbuseWord(word).then(result => {
            // If any word is abusive, set the flag and break
            if (result) {
                isAbusive = true;
                alert('Please choose another username.');
                return; // Return early if abusive word is found
            }

            // Proceed if no abusive word was found (this will be handled after loop finishes)
            if (isAbusive === false && word === words[words.length - 1]) {
                if(username) {
                    localStorage.setItem('userName', username);
                    localStorage.setItem('roomName', '10000');
                    roomId = '10000';
                    usernamePage.classList.add('hidden');
                    chatPage.classList.remove('hidden');

                    var socket = new SockJS('/ws');
                    stompClient = Stomp.over(socket);
                    stompClient.debug = null;
                    stompClient.connect({}, () => onConnected(false), onError);
                } else {
                    alert('Please enter a username.');
                    return;
                }
            }
        }).catch(error => {
            // Handle any error that occurs during the checkAbuseWord request
            console.error("Error checking abuse word:", error);
        });
    }


    event.preventDefault();
}

function onConnected(isReload = false, roomNumber = '10000', roomPassword = '10000') {
    roomId = roomNumber; // Set the current room number

    // Fetch previous chat messages from the server
    fetch(`/rooms/${roomId}/messages?password=${roomPassword}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Invalid room or password");
            }
            return response.json();
        })
        .then(messages => {
            console.log(`Fetching messages for room ${roomId}:`, messages.length);
            // Clear existing messages first
            messageArea.innerHTML = '';

            // Loop through the previous messages and display them
            messages.forEach(message => {
                var payload = {
                    body: JSON.stringify(message) // Convert the message object to a JSON string
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
            setTimeout(() => {
              }, 10000); // 1000 milliseconds = 1 second
              
            connectingElement.classList.add('hidden');

        })
        .catch(error => {
            console.log("Error fetching previous messages:", error);
            connectingElement.classList.add('hidden');
        });

    // Subscribe to the room topic
    stompClient.subscribe(`/topic/room/${roomId}`, onMessageReceived);
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var timestamp = new Date().getTime();
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT',
            timestamp: timestamp,
            roomId: localStorage.getItem("roomName")
        };
        console.log(`Sending message to room ${roomId}:`, chatMessage);
        stompClient.send(`/app/room/${roomId}/sendMessage`, {}, JSON.stringify(chatMessage));
//        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        snowfall(messageInput.value.length);
        messageInput.value = '';
    }
    event.preventDefault();
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

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
    
    var savedUsername = localStorage.getItem("userName");
    var roomName = localStorage.getItem("roomName");
    localStorage.removeItem('userName');
    localStorage.removeItem('roomName');

    var timestamp = new Date().getTime();
    var chatMessage = {
        sender: savedUsername,
        content: `${savedUsername} left!`,
        type: 'LEAVE',
        timestamp: timestamp,
        roomId: roomName
    };
    
    // Disconnect from WebSocket if connected
    if (stompClient) {
        stompClient.send(`/app/room/${roomId}/leaveUser`, {}, JSON.stringify(chatMessage));
        stompClient.disconnect(() => {
            console.log('Disconnected from server');
        });
    }
    
    // Clear chat messages
    messageArea.innerHTML = '';

    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');
    connectingElement.classList.remove('hidden');
}

function createRoom(event) {
    event.preventDefault();

    username = document.querySelector('#name').value.trim();
    if (username === '') {
        return;
    }

    var roomName = prompt("Enter the name of the room:");
    console.log("roomname", roomName);
    if(roomName === null) {
        return;
    }
    if (roomName && roomName.trim() !== "") {
        localStorage.setItem('userName', username);
        localStorage.setItem('roomName', roomName);
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            onConnected(false, roomName, 'abcd');
        }, onError);
    } else {
        alert('Room name cannot be empty!');
        return;
    }
};

function joinRoom(event) {
    event.preventDefault();
};

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
messageExit.addEventListener('click', exitChat, true);
createRoomButton.addEventListener('click', createRoom);

window.onload = function () {   
    loadingMsgs();
    const savedUsername = localStorage.getItem('userName');
    const savedRoomName = localStorage.getItem('roomName');

    if (savedUsername) {
        username = savedUsername;
        roomId = savedRoomName || '10000';
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        stompClient.connect({}, () => onConnected(true, roomId), onError);
    }
};

function snowfall(msgLen) {
    const snowflakeCount = Math.min(msgLen*10, 500); // Number of snowflakes
    // const snowflakeContainer = document.body;
    const snowflakeContainer = snowFall;
    snowflakeContainer.replaceChildren();

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        
        // Randomize size (between 10px and 20px)
        const size = Math.random() * 10 + 20;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;

        // Randomize left position (between 0% and 100% of the viewport width)
        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.top = `-${Math.random() * 80}vw`;

        // Randomize animation duration (between 5s and 8s)
        const randomSpeed = Math.random() * 3 + 10; // Speed between 5s and 8s
        snowflake.style.animationDuration = `${randomSpeed}s`;

        // Append snowflake to the body
        snowflakeContainer.appendChild(snowflake);  
    }
};

async function checkAbuseWord(word) {
    try {
        const response = await fetch(`/api/abuse/search/${encodeURIComponent(word)}`);
        // const response = await fetch(`/api/abuse/search?word=${encodeURIComponent(word)}`);
        if (response.ok) {
            const isAbusive = await response.json();            
            console.log(`Is abusive: ${isAbusive}`);
            return isAbusive;
        } else {
            console.error('Error checking word:', response.statusText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
