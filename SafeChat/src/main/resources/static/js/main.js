'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var messageExit = document.querySelector('#exit');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        localStorage.setItem('username', username);
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    else {
        alert('Please enter a username.');
        return;
    }
    event.preventDefault();
}


// function onConnected() {
//     // Subscribe to the Public Topic
//     stompClient.subscribe('/topic/public', onMessageReceived);

//     // Tell your username to the server
//     stompClient.send("/app/chat.addUser",
//         {},
//         JSON.stringify({sender: username, type: 'JOIN'})
//     )

//     connectingElement.classList.add('hidden');
// }

function onConnected() {
    // Fetch previous chat messages from the server
    fetch('/chats')
        .then(response => response.json())
        .then(messages => {
            console.log("fetching megs", messages);
            // Loop through the previous messages and display them
            messages.forEach(message => {
                var messageElement = document.createElement('li');
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

                var textElement = document.createElement('p');
                var messageText = document.createTextNode(message.content);
                textElement.appendChild(messageText);
                messageElement.appendChild(textElement);

                messageArea.appendChild(messageElement);
                messageArea.scrollTop = messageArea.scrollHeight;
            });
        })
        .catch(error => {
            console.log("Error fetching previous messages:", error);
        });

    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    );

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

// fetch("/chats")
//     .then(response => response.json())
//     .then(messages => {
//         let chatContainer = document.getElementById("chat-container");
//         chatContainer.innerHTML = '';  // Clear previous messages

//         messages.forEach(message => {
//             let messageElement = document.createElement("div");
//             messageElement.classList.add("message");
//             messageElement.innerHTML = `
//                 <p><strong>${message.sender}</strong>: ${message.message}</p>
//                 <p><em>${message.timestamp}</em></p>
//             `;
//             chatContainer.appendChild(messageElement);
//         });
//     })
//     .catch(error => console.log("Error fetching messages:", error));


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
    // Disconnect from WebSocket if connected
    if (stompClient) {
        stompClient.disconnect(() => {
            console.log('Disconnected from server');
        });
    }
    localStorage.removeItem('username'); // Clear the saved username
    // Reset the UI to the first page
    usernamePage.classList.remove('hidden'); // Show the username page
    chatPage.classList.add('hidden');       // Hide the chat page
}
usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
messageExit.addEventListener('click', exitChat, true);


window.onload = function () {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        username = savedUsername;
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
};

