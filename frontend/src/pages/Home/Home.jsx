import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import API_URL from "../../config/api.js";

const tools = [
  {
    id: "chat",
    icon: "💬",
    name: "Chat",
    description: "Talk with NexusAI",
  },
  {
    id: "vision",
    icon: "👁️",
    name: "Vision",
    description: "Analyze images",
  },
  {
    id: "images",
    icon: "🎨",
    name: "Images",
    description: "Create AI images",
  },
  {
    id: "videos",
    icon: "🎬",
    name: "Videos",
    description: "Create AI videos",
  },
  {
    id: "music",
    icon: "🎵",
    name: "Music",
    description: "Create original music",
  },
  {
    id: "call",
    icon: "📹",
    name: "Video Call",
    description: "Talk face-to-face with AI",
  },
];

const quickActions = [
  {
    icon: "💬",
    title: "Start a conversation",
    description: "Ask NexusAI anything",
  },
  {
    icon: "🎨",
    title: "Create an image",
    description: "Turn your ideas into images",
  },
  {
    icon: "🎬",
    title: "Create a video",
    description: "Generate videos from prompts",
  },
  {
    icon: "🎵",
    title: "Create music",
    description: "Make original music",
  },
];

function Home() {
  const { user, logout } = useAuth();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeTool, setActiveTool] = useState("chat");

  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch(`${API_URL}/api/conversations`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load conversations");
        }

        setConversations(data.conversations || []);
      } catch (error) {
        console.error("Load conversations error:", error);
      }
    }

    loadConversations();
  }, []);

  async function openConversation(id) {
    try {
      setMessageError("");

      const response = await fetch(
        `${API_URL}/api/conversations/${id}/messages`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load conversation");
      }

      const formattedMessages = data.messages.map((item) => ({
        id: item._id,
        sender: item.role === "user" ? "user" : "ai",
        text: item.content,
      }));

      setConversationId(id);
      setMessages(formattedMessages);
      setActiveTool("chat");
    } catch (error) {
      console.error("Open conversation error:", error);

      setMessageError(error.message || "Failed to open conversation.");
    }
  }

  async function deleteConversation(id) {
    try {
      setMessageError("");

      const response = await fetch(`${API_URL}/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete conversation");
      }

      // Remove the conversation from the sidebar
      setConversations((previous) =>
        previous.filter((conversation) => conversation._id !== id),
      );

      // If the deleted conversation is currently open,
      // return to a new empty chat.
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setMessage("");
        setActiveTool("chat");
      }
    } catch (error) {
      console.error("Delete conversation error:", error);

      setMessageError(error.message || "Failed to delete conversation.");
    }
  }

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Logout loading state
  const [loggingOut, setLoggingOut] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    setMessageError("");

    try {
      let currentConversationId = conversationId;

      // Create a conversation if this is the first message
      if (!currentConversationId) {
        const conversationResponse = await fetch(
          `${API_URL}/api/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              title: cleanMessage.slice(0, 50),
            }),
          },
        );

        const conversationData = await conversationResponse.json();

        if (!conversationResponse.ok || !conversationData.success) {
          throw new Error(
            conversationData.message || "Failed to create conversation",
          );
        }

        currentConversationId = conversationData.conversation._id;

        setConversationId(currentConversationId);

        // Add the new conversation to the sidebar
        setConversations((previous) => [
          conversationData.conversation,
          ...previous,
        ]);
      }

      // Show the user's message immediately
      const temporaryUserMessage = {
        id: `temp-user-${Date.now()}`,
        sender: "user",
        text: cleanMessage,
        temporary: true,
      };

      setMessages((previous) => [...previous, temporaryUserMessage]);

      setMessage("");

      // Send message to NexusAI backend
      const response = await fetch(
        `${API_URL}/api/conversations/${currentConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: cleanMessage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send message");
      }

      // Replace the temporary user message with the real MongoDB message
      setMessages((previous) =>
        previous.map((item) =>
          item.temporary
            ? {
                id: data.userMessage._id,
                sender: "user",
                text: data.userMessage.content,
              }
            : item,
        ),
      );

      // Add the real AI response
      const assistantMessage = {
        id: data.assistantMessage._id,
        sender: "ai",
        text: data.assistantMessage.content,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      console.error("Send message error:", error);

      setMessageError(
        error.message || "Something went wrong while contacting NexusAI.",
      );
    } finally {
      setSendingMessage(false);
    }
  }
  function handleQuickAction(action) {
    if (action === "Start a conversation") {
      setActiveTool("chat");
      return;
    }

    if (action === "Create an image") {
      setActiveTool("images");
      return;
    }

    if (action === "Create a video") {
      setActiveTool("videos");
      return;
    }

    if (action === "Create music") {
      setActiveTool("music");
    }
  }

  function handleNewChat() {
    setMessages([]);
    setMessage("");
    setConversationId(null);
    setMessageError("");
    setActiveTool("chat");
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const result = await logout();

      if (!result?.success) {
        console.error(result?.message || "Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  function handleSettings() {
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  const displayName = user?.name || "User";
  const userEmail = user?.email || "NexusAI user";

  return (
    <main className="nexus-app">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="nexus-sidebar">
        <div className="nexus-sidebar-top">
          {/* BRAND */}

          <div className="nexus-sidebar-brand">
            <div className="brand-symbol">✦</div>

            <div className="nexus-brand-text">
              <strong>NexusAI</strong>
              <span>AI Workspace</span>
            </div>
          </div>

          {/* NEW CHAT */}

          <button
            type="button"
            className="nexus-new-chat"
            onClick={handleNewChat}
          >
            <span>＋</span>
            <strong>New Chat</strong>
          </button>
          <nav className="nexus-chat-history">
            {conversations.length === 0 ? (
              <div className="nexus-chat-empty">No conversations yet</div>
            ) : (
              conversations.map((conversation) => (
                <div
                  className={`nexus-chat-history-item ${
                    conversationId === conversation._id
                      ? "nexus-chat-history-active"
                      : ""
                  }`}
                  key={conversation._id}
                >
                  <button
                    type="button"
                    className="nexus-chat-history-open"
                    onClick={() => openConversation(conversation._id)}
                  >
                    <span className="nexus-chat-history-icon">💬</span>

                    <span className="nexus-chat-history-title">
                      {conversation.title || "New conversation"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="nexus-chat-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteConversation(conversation._id);
                    }}
                    title="Delete conversation"
                    aria-label={`Delete ${
                      conversation.title || "conversation"
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </nav>

          {/* NAVIGATION */}

          <div className="nexus-nav-title">AI TOOLS</div>

          <nav className="nexus-tool-list">
            {tools.map((tool) => (
              <button
                type="button"
                key={tool.id}
                className={`nexus-tool ${
                  activeTool === tool.id ? "nexus-tool-active" : ""
                }`}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="nexus-tool-icon">{tool.icon}</span>

                <span className="nexus-tool-content">
                  <strong>{tool.name}</strong>
                  <small>{tool.description}</small>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* ===================================================
            SIDEBAR BOTTOM
        ==================================================== */}

        <div className="nexus-sidebar-bottom">
          {/* SETTINGS */}

          <button
            type="button"
            className="nexus-settings-button"
            onClick={handleSettings}
          >
            <span className="nexus-settings-icon">⚙️</span>

            <div>
              <strong>Settings</strong>
              <small>Account settings</small>
            </div>

            <span className="nexus-settings-arrow">›</span>
          </button>

          {/* USER */}

          <div className="nexus-user">
            <div className="nexus-user-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="nexus-user-info">
              <strong>{displayName}</strong>
              <span>{userEmail}</span>
            </div>

            <button
              type="button"
              className="nexus-logout"
              onClick={handleLogout}
              disabled={loggingOut}
              title={loggingOut ? "Logging out..." : "Logout"}
            >
              {loggingOut ? "…" : "↪"}
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="nexus-main">
        {/* TOP BAR */}

        <header className="nexus-header">
          <div className="nexus-mobile-brand">
            <div className="brand-symbol">✦</div>

            <div>
              <strong>NexusAI</strong>
              <span>AI Workspace</span>
            </div>
          </div>

          <div className="nexus-header-title">
            <strong>
              {activeTool === "chat"
                ? "NexusAI"
                : tools.find((tool) => tool.id === activeTool)?.name}
            </strong>

            <span>
              {activeTool === "chat" ? "AI Assistant" : "NexusAI AI Tool"}
            </span>
          </div>

          <div className="nexus-header-actions">
            <div className="nexus-online">
              <span />
              Online
            </div>

            <button
              type="button"
              className="nexus-header-button"
              title="Information"
            >
              ⓘ
            </button>

            {/* MOBILE SETTINGS */}

            <button
              type="button"
              className="nexus-header-button nexus-mobile-settings"
              onClick={handleSettings}
              title="Settings"
            >
              ⚙️
            </button>

            {/* MOBILE LOGOUT */}

            <button
              type="button"
              className="nexus-header-button nexus-mobile-logout"
              onClick={handleLogout}
              disabled={loggingOut}
              title={loggingOut ? "Logging out..." : "Logout"}
            >
              {loggingOut ? "…" : "↪"}
            </button>
          </div>
        </header>

        {/* =====================================================
            WORKSPACE
        ====================================================== */}

        <section className="nexus-workspace">
          {messages.length === 0 ? (
            <div className="nexus-dashboard">
              {/* HERO */}

              <div className="nexus-hero">
                <div className="nexus-ai-logo">✦</div>

                <p className="nexus-eyebrow">NEXUSAI AI WORKSPACE</p>

                <h1>
                  What can I help you
                  <span> create?</span>
                </h1>

                <p className="nexus-hero-description">
                  Chat with NexusAI, create images and videos, generate music,
                  analyze what you see and explore the future of AI.
                </p>
              </div>

              {/* QUICK ACTIONS */}

              <div className="nexus-section-heading">
                <div>
                  <h2>What would you like to do?</h2>
                  <p>Choose an AI tool to get started.</p>
                </div>
              </div>

              <div className="nexus-quick-grid">
                {quickActions.map((action) => (
                  <button
                    type="button"
                    key={action.title}
                    className="nexus-quick-card"
                    onClick={() => handleQuickAction(action.title)}
                  >
                    <div className="nexus-quick-icon">{action.icon}</div>

                    <div>
                      <strong>{action.title}</strong>

                      <p>{action.description}</p>
                    </div>

                    <span className="nexus-arrow">→</span>
                  </button>
                ))}
              </div>

              {/* FEATURES */}

              <div className="nexus-feature-row">
                <div>
                  <span>✦</span>
                  <strong>AI Conversations</strong>
                </div>

                <div>
                  <span>🎨</span>
                  <strong>Image Generation</strong>
                </div>

                <div>
                  <span>🎬</span>
                  <strong>Video Generation</strong>
                </div>

                <div>
                  <span>🎵</span>
                  <strong>Music Generation</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="nexus-messages">
              {messages.map((item) => (
                <div
                  className={`nexus-message-row ${
                    item.sender === "user"
                      ? "nexus-message-user"
                      : "nexus-message-ai"
                  }`}
                  key={item.id}
                >
                  {item.sender === "ai" && (
                    <div className="nexus-message-avatar">✦</div>
                  )}

                  <div className="nexus-message-content">
                    <div className="nexus-message-name">
                      {item.sender === "user" ? displayName : "NexusAI"}
                    </div>

                    <div className="nexus-message-bubble">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            MESSAGE COMPOSER
        ====================================================== */}

        <div className="nexus-composer-wrapper">
          {messageError && (
            <div className="nexus-message-error">{messageError}</div>
          )}
          <form className="nexus-composer" onSubmit={sendMessage}>
            <button
              type="button"
              className="nexus-composer-button"
              title="Attach file"
            >
              ＋
            </button>

            <input
              type="text"
              placeholder={
                sendingMessage ? "NexusAI is thinking..." : "Message NexusAI..."
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={sendingMessage}
            />

            <button
              type="button"
              className="nexus-composer-button"
              title="Voice"
            >
              🎙️
            </button>

            <button
              type="submit"
              className="nexus-send-button"
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? "…" : "↑"}
            </button>
          </form>

          <p className="nexus-disclaimer">
            NexusAI can make mistakes. Check important information before
            relying on it.
          </p>
        </div>
      </section>

      {/* =====================================================
          SETTINGS MODAL
      ====================================================== */}

      {settingsOpen && (
        <div
          className="nexus-settings-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSettings();
            }
          }}
        >
          <div
            className="nexus-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            {/* SETTINGS HEADER */}

            <div className="nexus-settings-header">
              <div>
                <span className="nexus-settings-title-icon">⚙️</span>

                <div>
                  <h2 id="settings-title">Settings</h2>
                  <p>Manage your NexusAI account</p>
                </div>
              </div>

              <button
                type="button"
                className="nexus-settings-close"
                onClick={closeSettings}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* ACCOUNT */}

            <div className="nexus-settings-section">
              <div className="nexus-settings-section-title">ACCOUNT</div>

              <div className="nexus-account-card">
                <div className="nexus-account-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="nexus-account-details">
                  <strong>{displayName}</strong>
                  <span>{userEmail}</span>
                </div>
              </div>
            </div>

            {/* ACCOUNT INFORMATION */}

            <div className="nexus-settings-section">
              <div className="nexus-settings-section-title">
                ACCOUNT INFORMATION
              </div>

              <div className="nexus-settings-row">
                <div>
                  <strong>Display name</strong>
                  <span>{displayName}</span>
                </div>
              </div>

              <div className="nexus-settings-row">
                <div>
                  <strong>Email address</strong>
                  <span>{userEmail}</span>
                </div>
              </div>
            </div>

            {/* SESSION */}

            <div className="nexus-settings-section">
              <div className="nexus-settings-section-title">SESSION</div>

              <button
                type="button"
                className="nexus-settings-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <span>↪</span>

                <div>
                  <strong>{loggingOut ? "Logging out..." : "Log out"}</strong>

                  <small>Sign out of your NexusAI account</small>
                </div>
              </button>
            </div>

            {/* FOOTER */}

            <div className="nexus-settings-footer">
              <button
                type="button"
                className="nexus-settings-done"
                onClick={closeSettings}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;
