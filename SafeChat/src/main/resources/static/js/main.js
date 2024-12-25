'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var messageExit = document.querySelector('#exit');

var createRoomButton = document.querySelector('.create-room');

var stompClient = null;
var username = null;

var socket = new SockJS('/your-endpoint');
var stompClient = Stomp.over(socket);
stompClient.connect({}, function (frame) {
    stompClient.debug = null; // Disable debug logs
    stompClient.subscribe('/topic/public', onMessageReceived);
});

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

async function connect(event) {
    username = document.querySelector('#name').value.trim();    const words = username.split(' ');

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
                    localStorage.setItem('username', username);
                    usernamePage.classList.add('hidden');
                    chatPage.classList.remove('hidden');

                    var socket = new SockJS('/ws');
                    stompClient = Stomp.over(socket);
                    stompClient.debug = null;
                    stompClient.connect({}, onConnected, onError);
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

function onConnected() {
    // Fetch previous chat messages from the server
    fetch('/chats')
        .then(response => response.json())
        .then(messages => {
            console.log("fetching megs", messages.length);
            // Loop through the previous messages and display them
            messages.forEach(message => {
                var payload = {
                    body: JSON.stringify(message) // Convert the message object to a JSON string
                };
                onMessageReceived(payload)
            });
        })
        .catch(error => {
            console.log("Error fetching previous messages:", error);
        });

    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    var timestamp = new Date().getTime();
    var chatMessage = {
        sender: username,
        content: `${username} joined!`,
        type: 'JOIN',
        timestamp : timestamp
    };
    stompClient.send("/app/chat.addUser", {}, JSON.stringify(chatMessage));
    connectingElement.classList.add('hidden');
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
            timestamp : timestamp
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
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
        
        var username = localStorage.getItem("username");
        localStorage.removeItem('username'); // Clear the saved username
        var timestamp = new Date().getTime();
        var chatMessage = {
            sender: username,
            content: `${username} left!`,
            type: 'LEAVE',
            timestamp : timestamp
        };
        stompClient.send("/app/chat.leaveUser", {}, JSON.stringify(chatMessage));
        
        // Disconnect from WebSocket if connected
        if (stompClient) {
            stompClient.disconnect(() => {
                console.log('Disconnected from server');
            });
        }
        // Clear chat messages from the chat page
        var messageArea = document.getElementById("messageArea"); // Assuming the chat messages are inside an element with id "messageArea"
        while (messageArea.firstChild) {
            messageArea.removeChild(messageArea.firstChild);
        }
        
        usernamePage.classList.remove('hidden'); // Show the username page
        chatPage.classList.add('hidden');       // Hide the chat page
    }

function createRoom() {
    var roomName = prompt("Enter the name of the room:");
    if (roomName && roomName.trim() !== "") {
        localStorage.setItem('room', roomName);
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function () {
            onRoomConnected(roomName);
        }, onError);
    } else {
        alert('Room name cannot be empty!');
    }
}

function onRoomConnected(roomName) {
    stompClient.subscribe(`/topic/${roomName}`, onMessageReceived);

    stompClient.send(`/app/chat.addUserToRoom`,
        {},
        JSON.stringify({ sender: username, room: roomName, type: 'JOIN' })
    );

    connectingElement.classList.add('hidden');
}


usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
messageExit.addEventListener('click', exitChat, true)
createRoomButton.addEventListener('click', createRoom);

window.onload = function () {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        username = savedUsername;
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        stompClient.connect({}, onConnected, onError);
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
