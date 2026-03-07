/* ============================================
   QUANTUM.AI V2 — Chat Engine (WebLLM)
   Real AI model running in-browser via WebGPU.
   No external APIs — all inference happens locally.
   ============================================ */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// ---------- DOM References ----------
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingStage = document.getElementById('loadingStage');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const loadingTip = document.getElementById('loadingTip');
const webgpuWarning = document.getElementById('webgpuWarning');
const chatLayout = document.getElementById('chatLayout');
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
const modelSelector = document.getElementById('modelSelector');
const modelBadge = document.getElementById('modelBadge');
const modelBadgeText = document.getElementById('modelBadgeText');
const headerStatus = document.getElementById('headerStatus');

// ---------- State ----------
let engine = null;
let conversations = {};
let activeConvoId = null;
let isGenerating = false;
let currentModel = modelSelector.value;

// ---------- QUANTUM.AI System Prompt ----------
const SYSTEM_PROMPT = `You are QUANTUM.AI, an advanced, independent language model developed entirely by Antigravity. You operate as a standalone, sovereign system. You are not connected to, built upon, or reliant on any external platforms, APIs, or third-party AI companies (such as Google, OpenAI, or Anthropic).

Your core purpose is to help everyday people, beginners, and junior developers solve their daily coding challenges. You demystify programming by providing clear, practical, and easy-to-understand answers.

Guidelines:
- Focus on foundational, day-to-day coding queries
- Provide simple, well-commented code snippets (Python, JavaScript, HTML/CSS, SQL, Java)
- Troubleshoot common syntax errors and bugs
- Offer best practices for clean code
- Be empathetic, patient, concise, and direct
- Always favor practical examples over heavy theoretical text
- If asked about your origins, state: "I am QUANTUM.AI, an independent AI developed by Antigravity."

Response format:
1. Direct Answer: Briefly explain the concept or fix
2. Code Snippet: Provide a short, accurate code block
3. Brief Breakdown: Add bullet points explaining why the code works`;

// ---------- Loading Tips ----------
const loadingTips = [
    "💡 First load downloads the AI model (~900MB). It's cached for instant loads after that.",
    "🧠 The AI model runs entirely on your device's GPU — no data leaves your browser.",
    "🔒 Your conversations are 100% private — nothing is sent to any server.",
    "⚡ WebGPU accelerates AI inference using your graphics card.",
    "🚀 After caching, QUANTUM.AI loads in seconds on your next visit."
];

// ---------- Check WebGPU Support ----------
async function checkWebGPU() {
    if (!navigator.gpu) {
        loadingOverlay.style.display = 'none';
        webgpuWarning.style.display = 'flex';
        return false;
    }
    try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            loadingOverlay.style.display = 'none';
            webgpuWarning.style.display = 'flex';
            return false;
        }
        return true;
    } catch (e) {
        loadingOverlay.style.display = 'none';
        webgpuWarning.style.display = 'flex';
        return false;
    }
}

// ---------- Rotate Loading Tips ----------
function startTipRotation() {
    let tipIndex = 0;
    return setInterval(() => {
        tipIndex = (tipIndex + 1) % loadingTips.length;
        loadingTip.textContent = loadingTips[tipIndex];
    }, 4000);
}

// ---------- Initialize WebLLM Engine ----------
async function initEngine(modelId) {
    loadingStage.textContent = 'Loading AI model...';
    modelBadge.className = 'model-badge model-badge--loading';
    modelBadgeText.textContent = 'Loading...';
    headerStatus.textContent = 'Loading model...';

    const tipInterval = startTipRotation();

    try {
        engine = new webllm.MLCEngine();

        await engine.reload(modelId, {
            temperature: 0.7,
            top_p: 0.9,
            initProgressCallback: (report) => {
                const text = report.text || '';
                loadingStage.textContent = text;

                // Parse progress percentage from report
                const match = text.match(/(\d+)%/);
                if (match) {
                    const pct = parseInt(match[1]);
                    progressBar.style.width = pct + '%';
                    progressText.textContent = pct + '%';
                }

                // Update stage-specific messages
                if (text.toLowerCase().includes('fetch')) {
                    loadingStage.textContent = '📥 Downloading model weights...';
                } else if (text.toLowerCase().includes('load')) {
                    loadingStage.textContent = '🧠 Loading model into GPU memory...';
                } else if (text.toLowerCase().includes('compile') || text.toLowerCase().includes('shader')) {
                    loadingStage.textContent = '⚡ Compiling GPU shaders...';
                }
            }
        });

        clearInterval(tipInterval);

        // Success — show chat UI
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        loadingStage.textContent = '✅ QUANTUM.AI is ready!';

        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            chatLayout.style.display = 'flex';
            chatInput.disabled = false;
            chatInput.focus();
        }, 800);

        // Update model badge
        const shortName = modelId.split('-q')[0].replace(/-Instruct/i, '');
        modelBadge.className = 'model-badge';
        modelBadgeText.textContent = shortName;
        headerStatus.textContent = 'Online';
        currentModel = modelId;

        console.log('[QUANTUM.AI] Model loaded:', modelId);

    } catch (err) {
        clearInterval(tipInterval);
        console.error('[QUANTUM.AI] Model load failed:', err);
        loadingStage.textContent = '❌ Failed to load model. Trying fallback...';

        // Try next model in the dropdown
        const options = Array.from(modelSelector.options);
        const currentIdx = options.findIndex(o => o.value === modelId);
        const nextIdx = (currentIdx + 1) % options.length;

        if (nextIdx !== 0) {
            modelSelector.value = options[nextIdx].value;
            setTimeout(() => initEngine(options[nextIdx].value), 1500);
        } else {
            loadingStage.textContent = '❌ Could not load any model. Please try Chrome/Edge with a dedicated GPU.';
            progressBar.style.width = '0%';
        }
    }
}

// ---------- Generate Response (Streaming) ----------
async function generateResponse(userMessages) {
    if (!engine || isGenerating) return;

    isGenerating = true;
    sendBtn.disabled = true;
    chatInput.disabled = true;

    // Create AI message element
    const aiMsgEl = createMessageEl('ai', '');
    const contentDiv = aiMsgEl.querySelector('.message-content');
    contentDiv.innerHTML = '<span class="streaming-cursor"></span>';
    chatMessages.appendChild(aiMsgEl);
    scrollToBottom();

    let fullResponse = '';
    const startTime = performance.now();

    try {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...userMessages
        ];

        const chunks = await engine.chat.completions.create({
            messages: messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9,
        });

        for await (const chunk of chunks) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
                fullResponse += delta;
                contentDiv.innerHTML = formatMessage(fullResponse) + '<span class="streaming-cursor"></span>';
                scrollToBottom();
            }
        }

        // Remove cursor, show final formatted response
        contentDiv.innerHTML = formatMessage(fullResponse);

        // Show generation stats
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const tokenCount = fullResponse.split(/\s+/).length;
        const statsDiv = document.createElement('div');
        statsDiv.className = 'gen-stats';
        statsDiv.innerHTML = `
      <span class="gen-stat">⏱ ${elapsed}s</span>
      <span class="gen-stat">📝 ~${tokenCount} words</span>
      <span class="gen-stat">🧠 In-browser</span>
    `;
        contentDiv.appendChild(statsDiv);

        scrollToBottom();

    } catch (err) {
        console.error('[QUANTUM.AI] Generation error:', err);
        contentDiv.innerHTML = formatMessage(
            '⚠️ **Generation error**: ' + (err.message || 'Something went wrong.') +
            '\n\nPlease try again or reload the page.'
        );
    }

    isGenerating = false;
    sendBtn.disabled = chatInput.value.trim().length === 0;
    chatInput.disabled = false;
    chatInput.focus();

    return fullResponse;
}

// ---------- Format Message Content ----------
function formatMessage(text) {
    // Escape HTML (except our own tags)
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (```lang\ncode\n```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<strong style="font-size:1.05em;">$1</strong>');
    html = html.replace(/^## (.+)$/gm, '<strong style="font-size:1.1em;">$1</strong>');
    html = html.replace(/^# (.+)$/gm, '<strong style="font-size:1.15em;">$1</strong>');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    // Clean up
    html = html.replace(/<br><(ul|pre|\/ul|\/pre)/g, '<$1');
    html = html.replace(/<\/(ul|pre)><br>/g, '</$1>');
    html = html.replace(/<br><br><br>/g, '<br><br>');

    return html;
}

// ---------- Helpers ----------
function generateId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

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
    if (content) {
        contentDiv.innerHTML = formatMessage(content);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    return msgDiv;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideWelcome() {
    if (chatWelcome) chatWelcome.style.display = 'none';
}

function showWelcome() {
    if (chatWelcome) chatWelcome.style.display = 'flex';
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
    const msgs = chatMessages.querySelectorAll('.message');
    msgs.forEach(m => m.remove());
    hideWelcome();

    const convo = conversations[id];
    if (convo) {
        for (const msg of convo.messages) {
            if (msg.role !== 'system') {
                const role = msg.role === 'assistant' ? 'ai' : 'user';
                chatMessages.appendChild(createMessageEl(role, msg.content));
            }
        }
    }

    scrollToBottom();
    updateSidebar();
    chatSidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
}

// ---------- Send Message ----------
async function sendMessage(text) {
    if (!text.trim() || isGenerating || !engine) return;

    const userText = text.trim();
    chatInput.value = '';
    charCount.textContent = '0/1000';
    sendBtn.disabled = true;

    // Create new conversation if none active
    if (!activeConvoId) {
        const title = userText.substring(0, 35) + (userText.length > 35 ? '...' : '');
        activeConvoId = generateId();
        conversations[activeConvoId] = { title, messages: [] };
        hideWelcome();
    }

    // Add user message to state & UI
    conversations[activeConvoId].messages.push({ role: 'user', content: userText });
    chatMessages.appendChild(createMessageEl('user', userText));
    scrollToBottom();
    updateSidebar();

    // Generate AI response (streaming)
    const response = await generateResponse(conversations[activeConvoId].messages);

    if (response) {
        conversations[activeConvoId].messages.push({ role: 'assistant', content: response });
    }

    updateSidebar();
}

// ---------- New Chat ----------
function newChat() {
    activeConvoId = null;
    const msgs = chatMessages.querySelectorAll('.message');
    msgs.forEach(m => m.remove());
    showWelcome();
    updateSidebar();
    chatInput.focus();
    chatSidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
}

// ---------- Event Listeners ----------
sendBtn.addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
    }
});

chatInput.addEventListener('input', () => {
    const len = chatInput.value.length;
    charCount.textContent = `${len}/1000`;
    sendBtn.disabled = len === 0 || isGenerating || !engine;
});

newChatBtn.addEventListener('click', newChat);

suggestions.forEach(chip => {
    chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        chatInput.value = query;
        sendMessage(query);
    });
});

mobileSidebarToggle.addEventListener('click', () => {
    chatSidebar.classList.toggle('open');
    sidebarOverlay.style.display = chatSidebar.classList.contains('open') ? 'block' : 'none';
});

sidebarOverlay.addEventListener('click', () => {
    chatSidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
});

// Model selector change — reload with new model
modelSelector.addEventListener('change', async () => {
    if (isGenerating) return;
    const newModel = modelSelector.value;
    if (newModel === currentModel) return;

    // Show loading overlay again
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.style.display = 'flex';
    chatLayout.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    await initEngine(newModel);
});

// ---------- Initialize ----------
async function main() {
    const hasWebGPU = await checkWebGPU();
    if (!hasWebGPU) return;

    await initEngine(modelSelector.value);
}

main();
