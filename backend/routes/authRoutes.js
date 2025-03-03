router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();
      res.status(201).json({ message: "User created successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
  
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, username: user.username });
  });
  