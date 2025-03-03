const API_URL = "http://localhost:5000/api"; // Updated API prefix

const handleLogin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    localStorage.setItem("token", response.data.token);
    setToken(response.data.token);
  } catch (err) {
    console.error("Login failed:", err.response?.data?.message || err.message);
  }
};

useEffect(() => {
  if (!token) return;

  axios
    .get(`${API_URL}/messages`, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => {
      setMessages(response.data);
    });

  const socket = socketIOClient("http://localhost:5000");

  socket.on("receiveMessage", (data) => {
    setMessages((prevMessages) => [...prevMessages, data]);
  });

  return () => socket.disconnect();
}, [token]);
