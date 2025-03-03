io.on("connection", (socket) => {
    console.log("A user connected");
  
    socket.on("sendMessage", async (data) => {
      const message = new Message({ user: data.user, content: data.content });
      await message.save();
      io.emit("receiveMessage", message); // Ensure frontend listens for "receiveMessage"
    });
  
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
  