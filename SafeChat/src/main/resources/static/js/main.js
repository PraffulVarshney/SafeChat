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
var joinRoomButton = document.querySelector('.join-room');


var username = null;

var roomId = sessionStorage.getItem('room');
if(roomId===null)
{
    roomId='global';
}


var socket = new SockJS('/ws');
var stompClient = Stomp.over(socket);

stompClient.connect({}, function () {
    stompClient.subscribe("/topic/" + roomId, onMessageReceived);
});


// const createRoom = (roomId, password) => {
//     stompClient.send("/app/createRoom", {}, JSON.stringify({ roomId, password }));
// };

// const joinRoom = (roomId, password) => {
//     stompClient.connect(
//         { roomId, password },
//         () => {
//             stompClient.subscribe(`/topic/${roomId}`, onMessageReceived);
//         },
//         onError
//     );
// };


// stompClient.connect({ roomId}, function (frame) {
//     stompClient.debug = null; // Disable debug logs
//     stompClient.subscribe('/topic/public', onMessageReceived);
// });

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

async function getUsername() {
    const usernameInput = document.getElementById('name').value.trim();
    const usernamePattern = /^(?=.*[A-Za-z0-9_\-\.])[A-Za-z0-9 _\-\.]*$/;
    if (!usernameInput || !usernamePattern.test(usernameInput)) {
        alert('Please enter a valid username (only letters, numbers, -, _, . allowed).');
        return "";  // Return an empty string if the username is invalid    
    }
    const words = usernameInput.split(/[ ._-]+/);
    try {
        // Wait for the result of the abuse word check
        const result = await checkAbuseWord(words);
        if (result) {
            alert('Please choose another username.');
            return "";  // Return an empty string if abuse word is found
        }
    } catch (error) {
        console.error("Error checking abuse word:", error);
    }
    return usernameInput;  // Return the valid username
}


async function connect(event) {

    event.preventDefault();
    loadingMsgs();
    roomId = "global"
    username = await getUsername();        
    if (username === "") {
        // alert('Please enter a username.');
        return;
    }
    document.getElementById('createRoomUsername').value = username;
    document.getElementById('joinRoomUsername').value = username;
    
    localStorage.setItem('username', username);
    sessionStorage.setItem('room', 'global');

    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');

    var socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    // stompClient.debug = null;
    stompClient.connect({}, () => onConnected(roomId, false), onError);

}

function onConnected(roomName, isReload = false) {
    const token = localStorage.getItem('jwtToken');
    // Fetch previous chat messages from the server    
    roomId = roomName
        fetch(`/chats/${roomName}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
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

            // Send a "user joined" message only if it's not a reload
            if (!isReload) {
                var timestamp = new Date().getTime();
                var chatMessage = {
                    sender: username,
                    content: `${username} joined!`,
                    type: 'JOIN',
                    roomId: roomName,
                    timestamp: timestamp
                };
                stompClient.send(`/app/chat.addUser/${roomName}`, {}, JSON.stringify(chatMessage));
                // stompClient.send("/app/chat.addUser", {}, JSON.stringify(chatMessage));
            }
            setTimeout(() => {
              }, 10000); // 1000 milliseconds = 1 second
              
            connectingElement.classList.add('hidden');

        })
        .catch(error => {
            console.log("Error fetching previous messages:", error);
        });
    // Subscribe to the Public Topic
    stompClient.subscribe(`/topic/${roomName}`, onMessageReceived);

}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {

    var messageContent = messageInput.value.trim();
    var roomId = sessionStorage.getItem('room')
    if(messageContent && stompClient) {
        var timestamp = new Date().getTime();
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT',
            timestamp : timestamp,
            roomId : roomId
        };
        stompClient.send(`/app/chat.sendMessage/${roomId}`, {}, JSON.stringify(chatMessage));
        // stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
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

function loadingMsgs()
{
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
    
    var username = localStorage.getItem("username");
    var roomId = sessionStorage.getItem("room")
    localStorage.removeItem('username'); // Clear the saved username
    sessionStorage.removeItem('room'); // room
    
    var timestamp = new Date().getTime();
    var chatMessage = {
        sender: username,
        content: `${username} left!`,
        type: 'LEAVE',
        roomId: roomId,
        timestamp : timestamp
    };
    stompClient.send(`/app/chat.leaveUser/${roomId}`, {}, JSON.stringify(chatMessage));

    // stompClient.send("/app/chat.leaveUser", {}, JSON.stringify(chatMessage));
    
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
    connectingElement.classList.remove('hidden');
}

async function createRoom(event) {


    
    event.preventDefault();
    username = await getUsername();        
    console.log(username)
    if(username === "")
    {
        return
    }
    
    var roomName = prompt("Enter the name of the room:");
    var roomPassword = prompt("Enter the password of the room:");
    if (roomName && roomName.trim() !== "") {


        // document.getElementById('createRoomUsername').value = username;
        // document.getElementById('joinRoomUsername').value = username;
        
        // localStorage.setItem('username', username);
        // sessionStorage.setItem('room', 'global');

        // usernamePage.classList.add('hidden');
        // chatPage.classList.remove('hidden');

        // var socket = new SockJS('/ws');
        // stompClient = Stomp.over(socket);
        // // stompClient.debug = null;
        // stompClient.connect({}, () => onConnected(roomId, false), onError);



        sessionStorage.setItem('room', roomName);
        localStorage.setItem('username', username);
        
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        
        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        var msg = {
            'roomId' : roomName,
            'password' : roomPassword
        }
        stompClient.connect({}, function () {
            onConnected(roomName)
        }, onError);
        stompClient.send('/createRoom', {}, JSON.stringify(msg));

    } else {
        alert('Room name cannot be empty!');
    }
}

async function joinRoom(event){
    event.preventDefault();
    username = await getUsername();        
    console.log(username)
    if(username === "")
    {
        return
    }
    var roomName = prompt("Enter the name of the room:");
    roomId = roomName   


   return; 
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

// usernameForm.addEventListener('submit', function(event) {
//     event.preventDefault(); // Prevent form submission
//     var username = getUsername();  // Get the shared username
//     connect(username);  // Call the connect function with the username
// }, true);

messageForm.addEventListener('submit', sendMessage, true)
messageExit.addEventListener('click', exitChat, true)
createRoomButton.addEventListener('click', createRoom);
// createRoomButton.addEventListener('click', function(event) {
    // event.preventDefault();  // Prevent default action
    // var username = getUsername();  // Get the shared username
    // createRoom(username);  // Call the createRoom function with the username
// });
// joinRoomButton.addEventListener('click', joinRoom);
// joinRoomButton.addEventListener('click', function(event) {
//     event.preventDefault();  // Prevent default action
//     var username = getUsername();  // Get the shared username
//     joinRoom(username);  // Call the joinRoom function with the username
// });


window.onload = function () {   
    loadingMsgs();
    const savedUsername = localStorage.getItem('username');
    const savedRoomId = sessionStorage.getItem('room');        

    if (savedUsername) {
        username = savedUsername;
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        // stompClient.debug = null;
        stompClient.connect({}, function () {
            onConnected(roomName)
        }, onError);

        stompClient.connect({}, () => onConnected(savedRoomId, true), onError);
        // stompClient.connect({}, onConnected, onError);
    }
};

function snowfall(msgLen) {
    const snowflakeCount = Math.min(msgLen*10,500); 
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

// // JavaScript function to send login credentials and save token
// async function login(username) {
//     const loginRequest = {
//         username: username,
//     };

//     try {
//         // Make a POST request to the backend for login
//         const response = await fetch('/auth/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(loginRequest)
//         });

//         if (response.ok) {
//             // Parse JSON response to get the token
//             const data = await response.json();
//             const token = data.token;

//             // Store the token in localStorage
//             localStorage.setItem('jwtToken', token);

//             console.log('Token saved:', token);
//         } else {
//             console.error('Login failed:', response.statusText);
//         }
//     } catch (error) {
//         console.error('Error logging in:', error);
//     }
// }