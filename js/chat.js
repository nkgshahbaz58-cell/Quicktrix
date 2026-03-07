/* ============================================
   QUANTUM.AI — Chat Engine (V1)
   Pre-scripted response system with keyword matching.
   Completely independent — no external APIs.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- DOM References ----------
    const chatMessages = document.getElementById('chatMessages');
    const chatWelcome = document.getElementById('chatWelcome');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const charCount = document.getElementById('charCount');
    const newChatBtn = document.getElementById('newChatBtn');
    const sidebarChats = document.getElementById('sidebarChats');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const chatSidebar = document.getElementById('chatSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    // ---------- State ----------
    let conversations = {};   // { id: { title, messages: [{role, content}] } }
    let activeConvoId = null;
    let isTyping = false;

    // ---------- Pre-Scripted Knowledge Base ----------
    const knowledgeBase = [
        {
            keywords: ['hello', 'hi', 'hey', 'greet', 'howdy', 'sup'],
            title: 'Greeting',
            response: `Hey there! 👋 I'm **QUANTUM.AI**, your coding companion.\n\nI can help you with:\n- 🐍 **Python** basics (loops, functions, lists)\n- ⚡ **JavaScript** (variables, DOM, async/await)\n- 🎨 **HTML/CSS** (flexbox, grid, centering)\n- 🗃️ **SQL** (SELECT, JOIN)\n- 🧹 **Clean code** best practices\n\nJust type your question and I'll give you a clear answer with a code example!`
        },
        {
            keywords: ['for loop', 'for loop in python', 'python loop', 'loop python', 'iterate python'],
            title: 'Python For Loops',
            response: `A **for loop** in Python lets you iterate over a sequence (like a list, string, or range).\n\n<pre><code># Loop through a list\nfruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print(f"I love {fruit}!")\n\n# Loop with range (0 to 4)\nfor i in range(5):\n    print(f"Count: {i}")\n\n# Loop with index using enumerate\nfor index, fruit in enumerate(fruits):\n    print(f"{index}: {fruit}")</code></pre>\n\n- \`for item in collection\` iterates through each element directly\n- \`range(n)\` generates numbers from 0 to n-1\n- \`enumerate()\` gives you both the index and the value`
        },
        {
            keywords: ['variable', 'variables', 'javascript variable', 'let const var', 'declare variable'],
            title: 'JavaScript Variables',
            response: `In JavaScript, you declare variables using **let**, **const**, or **var**.\n\n<pre><code>// ✅ Use 'const' for values that don't change\nconst API_URL = "https://example.com";\nconst MAX_RETRIES = 3;\n\n// ✅ Use 'let' for values that change\nlet score = 0;\nscore = 10;  // This is fine\n\nlet userName = "Alex";\nuserName = "Sam";  // Reassignment OK\n\n// ❌ Avoid 'var' — it has scoping issues\n// var oldWay = "don't use this";</code></pre>\n\n- **const** = can't be reassigned (use this by default)\n- **let** = can be reassigned (use when value changes)\n- **var** = old syntax with function-scoping quirks — avoid it in modern code`
        },
        {
            keywords: ['center div', 'center a div', 'centering css', 'center element', 'how to center'],
            title: 'Centering a Div in CSS',
            response: `Here are the **3 best ways** to center a div in CSS:\n\n<pre><code>/* Method 1: Flexbox (most common) */\n.parent {\n  display: flex;\n  justify-content: center;  /* horizontal */\n  align-items: center;      /* vertical */\n  height: 100vh;\n}\n\n/* Method 2: CSS Grid (cleanest) */\n.parent {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n}\n\n/* Method 3: Absolute positioning */\n.child {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}</code></pre>\n\n- **Flexbox** is the most versatile — use it for most cases\n- **Grid with place-items** is the shortest syntax\n- **Absolute positioning** works when you need pixel-level control`
        },
        {
            keywords: ['async', 'await', 'async await', 'asynchronous', 'promise', 'javascript async'],
            title: 'Async/Await in JavaScript',
            response: `**async/await** makes asynchronous code look and behave like synchronous code.\n\n<pre><code>// Without async/await (messy callbacks)\nfetch("https://api.example.com/data")\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n\n// ✅ With async/await (clean & readable)\nasync function getData() {\n  try {\n    const response = await fetch("https://api.example.com/data");\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error("Something went wrong:", error);\n  }\n}\n\ngetData();</code></pre>\n\n- \`async\` marks a function as asynchronous — it always returns a Promise\n- \`await\` pauses execution until the Promise resolves\n- Always wrap \`await\` calls in \`try/catch\` for error handling`
        },
        {
            keywords: ['function', 'functions', 'python function', 'def', 'how to write function'],
            title: 'Writing Functions',
            response: `A **function** is a reusable block of code that performs a specific task.\n\n<pre><code># Python function\ndef calculate_tip(bill, tip_percent=15):\n    \"\"\"Calculate tip amount from a bill.\"\"\"\n    tip = bill * (tip_percent / 100)\n    return round(tip, 2)\n\n# Using the function\nprint(calculate_tip(50))       # $7.5 (default 15%)\nprint(calculate_tip(50, 20))   # $10.0 (20% tip)</code></pre>\n\n<pre><code>// JavaScript function\nfunction calculateTip(bill, tipPercent = 15) {\n  const tip = bill * (tipPercent / 100);\n  return tip.toFixed(2);\n}\n\nconsole.log(calculateTip(50));      // "7.50"\nconsole.log(calculateTip(50, 20));  // "10.00"</code></pre>\n\n- Functions make code **reusable** and **easier to test**\n- Use **default parameters** for optional values\n- Always give functions **descriptive names** that explain what they do`
        },
        {
            keywords: ['array', 'list', 'python list', 'javascript array', 'arrays'],
            title: 'Arrays & Lists',
            response: `**Lists** (Python) and **Arrays** (JavaScript) store multiple values in a single variable.\n\n<pre><code># Python Lists\ncolors = ["red", "green", "blue"]\n\ncolors.append("yellow")     # Add to end\ncolors.insert(1, "orange")  # Add at index 1\ncolors.remove("red")        # Remove by value\nlast = colors.pop()          # Remove & return last\n\nprint(len(colors))  # Length\nprint(colors[0])    # First item</code></pre>\n\n<pre><code>// JavaScript Arrays\nconst colors = ["red", "green", "blue"];\n\ncolors.push("yellow");       // Add to end\ncolors.unshift("orange");    // Add to start\ncolors.splice(1, 1);         // Remove at index 1\n\nconsole.log(colors.length);  // Length\nconsole.log(colors[0]);      // First item\nconsole.log(colors.includes("blue")); // true</code></pre>\n\n- Both are **zero-indexed** (first item is at index 0)\n- Python uses \`append()\`, JavaScript uses \`push()\`\n- Both support slicing/filtering for advanced operations`
        },
        {
            keywords: ['dom', 'document object model', 'manipulate dom', 'javascript dom', 'getelementby'],
            title: 'JavaScript DOM Basics',
            response: `The **DOM** (Document Object Model) lets JavaScript interact with HTML elements.\n\n<pre><code>// Selecting elements\nconst title = document.getElementById("main-title");\nconst buttons = document.querySelectorAll(".btn");\nconst first = document.querySelector(".card");\n\n// Changing content\ntitle.textContent = "New Title";\ntitle.innerHTML = "<em>Italic Title</em>";\n\n// Changing styles\ntitle.style.color = "#7c3aed";\ntitle.style.fontSize = "2rem";\n\n// Adding/removing classes\ntitle.classList.add("active");\ntitle.classList.remove("hidden");\ntitle.classList.toggle("dark-mode");\n\n// Event listeners\nfirst.addEventListener("click", () => {\n  alert("Card clicked!");\n});</code></pre>\n\n- \`getElementById\` gets one element by its ID\n- \`querySelector\` gets the first match of a CSS selector\n- \`querySelectorAll\` gets all matches as a NodeList`
        },
        {
            keywords: ['debug', 'debugging', 'fix bug', 'troubleshoot', 'error', 'bug'],
            title: 'Debugging Tips',
            response: `Here are the **top debugging strategies** every developer should know:\n\n<pre><code>// 1. Console.log — the classic\nconsole.log("Value of x:", x);\nconsole.table(arrayOfObjects);  // Pretty table view\nconsole.error("Something broke!");\n\n// 2. Use typeof to check data types\nconsole.log(typeof myVariable);\n// "string", "number", "undefined", "object"\n\n// 3. Check for common mistakes\n// ❌ = (assignment) vs === (comparison)\nif (x = 5)   // WRONG — assigns 5 to x\nif (x === 5) // CORRECT — compares x to 5\n\n// 4. Breakpoints in DevTools\n// Open DevTools (F12) → Sources tab → Click line number</code></pre>\n\n- **Read the error message** — it usually tells you the exact line and issue\n- **Rubber duck debugging** — explain your code line-by-line out loud\n- **Isolate the problem** — comment out code until you find the broken part\n- **Google the error** — paste the exact error message into a search engine`
        },
        {
            keywords: ['sql', 'select', 'sql query', 'database query', 'sql basics'],
            title: 'SQL SELECT Basics',
            response: `A **SELECT** statement retrieves data from a database table.\n\n<pre><code>-- Get all columns from a table\nSELECT * FROM users;\n\n-- Get specific columns\nSELECT name, email FROM users;\n\n-- Filter with WHERE\nSELECT name, age FROM users\nWHERE age >= 18;\n\n-- Sort results\nSELECT name, age FROM users\nORDER BY age DESC;\n\n-- Limit results\nSELECT name FROM users\nLIMIT 10;\n\n-- Count rows\nSELECT COUNT(*) FROM users\nWHERE country = 'India';</code></pre>\n\n- \`SELECT *\` gets all columns (avoid in production — be specific)\n- \`WHERE\` filters rows based on conditions\n- \`ORDER BY\` sorts results (\`ASC\` = ascending, \`DESC\` = descending)\n- \`LIMIT\` restricts the number of rows returned`
        },
        {
            keywords: ['join', 'sql join', 'inner join', 'left join', 'table join'],
            title: 'SQL JOINs Explained',
            response: `A **JOIN** combines rows from two or more tables based on a related column.\n\n<pre><code>-- INNER JOIN (only matching rows)\nSELECT users.name, orders.product\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;\n\n-- LEFT JOIN (all from left + matches from right)\nSELECT users.name, orders.product\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id;\n\n-- Example with aliases (shorter syntax)\nSELECT u.name, o.product, o.total\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.total > 100\nORDER BY o.total DESC;</code></pre>\n\n- **INNER JOIN** — only rows that match in both tables\n- **LEFT JOIN** — all rows from the left table + matching rows from right\n- **RIGHT JOIN** — all rows from the right table + matching from left\n- Use **aliases** (e.g., \`users u\`) to keep queries readable`
        },
        {
            keywords: ['flexbox', 'css flexbox', 'display flex', 'flex direction'],
            title: 'CSS Flexbox',
            response: `**Flexbox** is the easiest way to create flexible, responsive layouts.\n\n<pre><code>/* Basic Flexbox Layout */\n.container {\n  display: flex;\n  gap: 16px;             /* space between items */\n}\n\n/* Direction */\n.row    { flex-direction: row; }      /* horizontal (default) */\n.column { flex-direction: column; }   /* vertical */\n\n/* Alignment */\n.centered {\n  justify-content: center;   /* main axis (horizontal) */\n  align-items: center;       /* cross axis (vertical) */\n}\n\n/* Distribution */\n.spread  { justify-content: space-between; }\n.even    { justify-content: space-evenly; }\n\n/* Item sizing */\n.item {\n  flex: 1;         /* grow equally */\n  flex-shrink: 0;  /* don't shrink */\n}</code></pre>\n\n- \`display: flex\` activates Flexbox on the container\n- \`justify-content\` = alignment along the main axis\n- \`align-items\` = alignment along the cross axis\n- \`gap\` replaces margin hacks between items`
        },
        {
            keywords: ['css grid', 'grid', 'display grid', 'grid template'],
            title: 'CSS Grid',
            response: `**CSS Grid** is perfect for building two-dimensional layouts (rows AND columns).\n\n<pre><code>/* Basic Grid */\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);  /* 3 equal columns */\n  gap: 20px;\n}\n\n/* Responsive grid (auto-fit) */\n.responsive-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 20px;\n}\n\n/* Named areas */\n.layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n  grid-template-columns: 250px 1fr;\n}\n\n.header  { grid-area: header; }\n.sidebar { grid-area: sidebar; }\n.main    { grid-area: main; }\n.footer  { grid-area: footer; }</code></pre>\n\n- \`1fr\` = one fraction of available space\n- \`repeat(3, 1fr)\` = three equal columns\n- \`auto-fit\` with \`minmax()\` creates responsive grids without media queries`
        },
        {
            keywords: ['html', 'html basics', 'what is html', 'html tags', 'html structure'],
            title: 'HTML Basics',
            response: `**HTML** (HyperText Markup Language) is the skeleton of every web page.\n\n<pre><code>&lt;!DOCTYPE html&gt;\n&lt;html lang="en"&gt;\n&lt;head&gt;\n  &lt;meta charset="UTF-8"&gt;\n  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;\n  &lt;title&gt;My Website&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n  &lt;header&gt;\n    &lt;h1&gt;Welcome!&lt;/h1&gt;\n    &lt;nav&gt;\n      &lt;a href="#about"&gt;About&lt;/a&gt;\n      &lt;a href="#contact"&gt;Contact&lt;/a&gt;\n    &lt;/nav&gt;\n  &lt;/header&gt;\n\n  &lt;main&gt;\n    &lt;section id="about"&gt;\n      &lt;h2&gt;About Me&lt;/h2&gt;\n      &lt;p&gt;I'm a web developer.&lt;/p&gt;\n    &lt;/section&gt;\n  &lt;/main&gt;\n\n  &lt;footer&gt;\n    &lt;p&gt;&amp;copy; 2026 My Website&lt;/p&gt;\n  &lt;/footer&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>\n\n- \`<head>\` contains metadata (title, charset, stylesheets)\n- \`<body>\` contains the visible content\n- Use **semantic tags** like \`<header>\`, \`<main>\`, \`<section>\`, \`<footer>\`\n- Every page needs \`<!DOCTYPE html>\` at the top`
        },
        {
            keywords: ['clean code', 'best practice', 'code quality', 'writing clean', 'readable code'],
            title: 'Clean Code Tips',
            response: `Here are the **golden rules** for writing clean, professional code:\n\n<pre><code># ❌ Bad — unclear naming\ndef calc(a, b):\n    return a * b * 0.08\n\n# ✅ Good — descriptive names\ndef calculate_sales_tax(price, quantity, tax_rate=0.08):\n    return price * quantity * tax_rate\n\n# ❌ Bad — magic numbers\nif user.age > 17:\n    allow_access()\n\n# ✅ Good — named constants\nMINIMUM_AGE = 18\nif user.age >= MINIMUM_AGE:\n    allow_access()</code></pre>\n\n**Key principles:**\n- **Descriptive names** — \`calculate_total()\` not \`calc()\`\n- **No magic numbers** — use named constants\n- **One function = one job** — keep functions small and focused\n- **DRY** — Don't Repeat Yourself; extract repeated code into functions\n- **Comments for WHY** — code shows WHAT, comments explain WHY`
        },
        {
            keywords: ['python', 'what is python', 'learn python', 'python intro', 'start python'],
            title: 'Getting Started with Python',
            response: `**Python** is one of the easiest and most popular programming languages — perfect for beginners!\n\n<pre><code># Variables (no type declaration needed)\nname = "Alex"\nage = 25\nis_developer = True\n\n# Print output\nprint(f"Hi, I'm {name} and I'm {age} years old.")\n\n# If/else\nif age >= 18:\n    print("You're an adult!")\nelse:\n    print("You're a minor.")\n\n# Lists\nskills = ["Python", "HTML", "CSS"]\nskills.append("JavaScript")\nprint(f"I know {len(skills)} languages.")\n\n# Functions\ndef greet(person):\n    return f"Hello, {person}! 👋"\n\nprint(greet("Sam"))</code></pre>\n\n- Python uses **indentation** instead of curly braces\n- **f-strings** (\`f"text {variable}"\`) are the best way to format strings\n- No semicolons needed — just write clean, readable code`
        },
        {
            keywords: ['javascript', 'what is javascript', 'learn javascript', 'js basics'],
            title: 'Getting Started with JavaScript',
            response: `**JavaScript** is the language of the web — it makes websites interactive!\n\n<pre><code>// Variables\nconst name = "Alex";        // can't reassign\nlet score = 0;              // can reassign\n\n// Functions\nfunction greet(person) {\n  return \`Hello, \${person}! 🚀\`;\n}\n\n// Arrow functions (shorter syntax)\nconst double = (n) => n * 2;\n\n// Arrays\nconst languages = ["Python", "JS", "HTML"];\nlanguages.push("CSS");\n\n// Objects\nconst user = {\n  name: "Alex",\n  age: 25,\n  skills: ["Python", "JavaScript"]\n};\n\nconsole.log(user.name);       // "Alex"\nconsole.log(greet("Sam"));    // "Hello, Sam! 🚀"\nconsole.log(double(21));      // 42</code></pre>\n\n- Use **const** by default, **let** when you need to reassign\n- **Template literals** (\\\`text \${var}\\\`) are the modern way to build strings\n- JavaScript runs in the browser AND on servers (Node.js)`
        }
    ];

    // ---------- Fallback Response ----------
    const fallbackResponse = `Great question! 🤔\n\nIn this **V1 demo**, I can answer questions about:\n- 🐍 **Python** (loops, functions, lists)\n- ⚡ **JavaScript** (variables, async/await, DOM)\n- 🎨 **HTML/CSS** (flexbox, grid, centering)\n- 🗃️ **SQL** (SELECT, JOIN)\n- 🧹 **Clean code** best practices\n\nTry asking something like:\n• *"How do I write a for loop in Python?"*\n• *"What is async/await?"*\n• *"How do I center a div?"*\n\nIn **V2**, I'll be powered by a full AI model and able to answer anything! 🚀`;

    // ---------- Find Best Match ----------
    function findResponse(userInput) {
        const input = userInput.toLowerCase().trim();

        let bestMatch = null;
        let bestScore = 0;

        for (const entry of knowledgeBase) {
            for (const keyword of entry.keywords) {
                if (input.includes(keyword)) {
                    // Longer keyword matches are more specific → higher score
                    const score = keyword.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = entry;
                    }
                }
            }
        }

        return bestMatch;
    }

    // ---------- Format Message Content ----------
    function formatMessage(text) {
        // Convert markdown-like bold to HTML
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert markdown-like italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Convert inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert bullet points
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^• (.+)$/gm, '<li>$1</li>');
        // Wrap consecutive <li> in <ul>
        html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        // Convert newlines to <br>
        html = html.replace(/\n/g, '<br>');
        // Clean up extra <br> around block elements
        html = html.replace(/<br><(ul|pre|\/ul|\/pre)/g, '<$1');
        html = html.replace(/<\/(ul|pre)><br>/g, '</$1>');

        return html;
    }

    // ---------- Generate Unique ID ----------
    function generateId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    // ---------- Create Message Element ----------
    function createMessageEl(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message message--${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (role === 'ai') {
            avatar.innerHTML = '<img src="assets/logo.png" alt="AI" class="avatar-logo-img">';
        } else {
            avatar.textContent = '👤';
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = formatMessage(content);

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(contentDiv);

        return msgDiv;
    }

    // ---------- Create Typing Indicator ----------
    function createTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.className = 'typing-indicator';
        wrapper.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.style.background = 'linear-gradient(135deg, #7c3aed, #06b6d4)';
        avatar.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.25)';
        avatar.innerHTML = '<img src="assets/logo.png" alt="AI" class="avatar-logo-img">';

        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        wrapper.appendChild(avatar);
        wrapper.appendChild(dots);

        return wrapper;
    }

    // ---------- Scroll to Bottom ----------
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ---------- Hide Welcome Screen ----------
    function hideWelcome() {
        if (chatWelcome) {
            chatWelcome.style.display = 'none';
        }
    }

    // ---------- Show Welcome Screen ----------
    function showWelcome() {
        if (chatWelcome) {
            chatWelcome.style.display = 'flex';
        }
    }

    // ---------- Update Sidebar ----------
    function updateSidebar() {
        sidebarChats.innerHTML = '';

        const ids = Object.keys(conversations).reverse();
        for (const id of ids) {
            const convo = conversations[id];
            const item = document.createElement('div');
            item.className = 'chat-history-item' + (id === activeConvoId ? ' active' : '');
            item.innerHTML = `<span class="chat-history-icon">💬</span><span class="chat-history-text">${convo.title}</span>`;
            item.addEventListener('click', () => loadConversation(id));
            sidebarChats.appendChild(item);
        }
    }

    // ---------- Load Conversation ----------
    function loadConversation(id) {
        activeConvoId = id;

        // Clear messages
        const msgs = chatMessages.querySelectorAll('.message, .typing-indicator');
        msgs.forEach(m => m.remove());

        hideWelcome();

        const convo = conversations[id];
        if (convo) {
            for (const msg of convo.messages) {
                chatMessages.appendChild(createMessageEl(msg.role, msg.content));
            }
        }

        scrollToBottom();
        updateSidebar();

        // Close mobile sidebar
        chatSidebar.classList.remove('open');
        sidebarOverlay.style.display = 'none';
    }

    // ---------- Send Message ----------
    function sendMessage(text) {
        if (!text.trim() || isTyping) return;

        const userText = text.trim();
        chatInput.value = '';
        charCount.textContent = '0/500';
        sendBtn.disabled = true;

        // Create new conversation if none active
        if (!activeConvoId) {
            const match = findResponse(userText);
            const title = match ? match.title : userText.substring(0, 30) + (userText.length > 30 ? '...' : '');
            activeConvoId = generateId();
            conversations[activeConvoId] = { title, messages: [] };
            hideWelcome();
        }

        // Add user message
        conversations[activeConvoId].messages.push({ role: 'user', content: userText });
        chatMessages.appendChild(createMessageEl('user', userText));
        scrollToBottom();

        // Show typing indicator
        isTyping = true;
        const typingEl = createTypingIndicator();
        chatMessages.appendChild(typingEl);
        scrollToBottom();

        // Simulate response delay (1.2–2.2 seconds)
        const delay = 1200 + Math.random() * 1000;
        setTimeout(() => {
            // Remove typing indicator
            const existing = document.getElementById('typingIndicator');
            if (existing) existing.remove();

            // Get response
            const match = findResponse(userText);
            const responseText = match ? match.response : fallbackResponse;

            // Add AI message
            conversations[activeConvoId].messages.push({ role: 'ai', content: responseText });
            chatMessages.appendChild(createMessageEl('ai', responseText));
            scrollToBottom();

            isTyping = false;
            updateSidebar();
        }, delay);

        updateSidebar();
    }

    // ---------- New Chat ----------
    function newChat() {
        activeConvoId = null;

        // Clear messages
        const msgs = chatMessages.querySelectorAll('.message, .typing-indicator');
        msgs.forEach(m => m.remove());

        showWelcome();
        updateSidebar();
        chatInput.focus();

        // Close mobile sidebar
        chatSidebar.classList.remove('open');
        sidebarOverlay.style.display = 'none';
    }

    // ---------- Event Listeners ----------

    // Send on click
    sendBtn.addEventListener('click', () => {
        sendMessage(chatInput.value);
    });

    // Send on Enter
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });

    // Character count & enable/disable send
    chatInput.addEventListener('input', () => {
        const len = chatInput.value.length;
        charCount.textContent = `${len}/500`;
        sendBtn.disabled = len === 0 || isTyping;
    });

    // New chat button
    newChatBtn.addEventListener('click', newChat);

    // Suggestion chips
    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            chatInput.value = query;
            sendMessage(query);
        });
    });

    // Mobile sidebar toggle
    mobileSidebarToggle.addEventListener('click', () => {
        chatSidebar.classList.toggle('open');
        sidebarOverlay.style.display = chatSidebar.classList.contains('open') ? 'block' : 'none';
    });

    // Close sidebar on overlay click
    sidebarOverlay.addEventListener('click', () => {
        chatSidebar.classList.remove('open');
        sidebarOverlay.style.display = 'none';
    });

    // ---------- Initialize ----------
    // Add some sample chat history
    const sampleId = generateId();
    conversations[sampleId] = {
        title: 'Python For Loops',
        messages: [
            { role: 'user', content: 'How do I write a for loop in Python?' },
            { role: 'ai', content: knowledgeBase.find(k => k.title === 'Python For Loops').response }
        ]
    };

    const sampleId2 = generateId();
    conversations[sampleId2] = {
        title: 'Centering a Div in CSS',
        messages: [
            { role: 'user', content: 'How do I center a div in CSS?' },
            { role: 'ai', content: knowledgeBase.find(k => k.title === 'Centering a Div in CSS').response }
        ]
    };

    updateSidebar();
    chatInput.focus();
});
