import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import axios from "axios";

const SOCKET_SERVER_URL = "http://localhost:5000"; // URL of the backend server
const API_URL = "http://localhost:5000"; // URL for API requests

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token")); // Store token in localStorage

  // Login handler
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      localStorage.setItem("token", response.data.token); // Store token in localStorage
      setToken(response.data.token); // Update token state
    } catch (err) {
      console.error("Login failed:", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (!token) return;

    // Fetch existing messages when the component mounts
    axios
      .get(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setMessages(response.data);
      });

    // Initialize socket connection
    const socket = socketIOClient(SOCKET_SERVER_URL);

    // Listen for new messages from other clients
    socket.on("message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Clean up the socket connection when the component unmounts
    return () => socket.disconnect();
  }, [token]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        user: username,
        content: newMessage,
      };

      // Emit the message to the backend via Socket.io
      const socket = socketIOClient(SOCKET_SERVER_URL);
      socket.emit("sendMessage", messageData);

      // Clear the input field
      setNewMessage("");
    }
  };

  if (!token) {
    return (
      <div>
        <h1>Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Real-Time Chat App</h1>
      <div>
        <textarea
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </div>
      <button onClick={handleSendMessage}>Send</button>

      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <strong>{message.user}</strong>: {message.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chat;
