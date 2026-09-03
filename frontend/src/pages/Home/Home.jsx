import { useEffect, useRef, useState } from "react";
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
  const messagesEndRef = useRef(null);

  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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

      // Close sidebar on mobile when opening a conversation
      setIsSidebarOpen(false);
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

      setConversations((previous) =>
        previous.filter((conversation) => conversation._id !== id),
      );

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

  const [settingsOpen, setSettingsOpen] = useState(false);
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

      /**
       * ========================================================
       * CREATE CONVERSATION IF THIS IS A NEW CHAT
       * ========================================================
       */

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

        setConversations((previous) => [
          conversationData.conversation,
          ...previous,
        ]);
      }

      /**
       * ========================================================
       * ADD USER MESSAGE TO THE UI
       * ========================================================
       */

      const temporaryUserMessage = {
        id: `temp-user-${Date.now()}`,
        sender: "user",
        text: cleanMessage,
        temporary: true,
      };

      setMessages((previous) => [...previous, temporaryUserMessage]);

      setMessage("");

      /**
       * ========================================================
       * ADD EMPTY AI MESSAGE
       *
       * This will be filled in as NexusAI streams its answer.
       * ========================================================
       */

      const temporaryAIMessage = {
        id: `temp-ai-${Date.now()}`,
        sender: "ai",
        text: "",
        temporary: true,
        streaming: true,
      };

      setMessages((previous) => [...previous, temporaryAIMessage]);

      /**
       * ========================================================
       * START STREAMING REQUEST
       * ========================================================
       */

      const response = await fetch(
        `${API_URL}/api/conversations/${currentConversationId}/messages/stream`,
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

      /**
       * ========================================================
       * HANDLE BACKEND ERROR
       * ========================================================
       */

      if (!response.ok) {
        let errorMessage = "Failed to send message";

        try {
          const errorData = await response.json();

          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(errorMessage);
      }

      /**
       * ========================================================
       * CHECK STREAM SUPPORT
       * ========================================================
       */

      if (!response.body) {
        throw new Error("Streaming is not supported by this browser.");
      }

      /**
       * ========================================================
       * READ STREAM
       * ========================================================
       */

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      let streamFinished = false;

      while (!streamFinished) {
        const { value, done } = await reader.read();

        /**
         * Add incoming data to the buffer.
         */

        if (value) {
          buffer += decoder.decode(value, {
            stream: !done,
          });
        }

        /**
         * SSE events are separated by two new lines.
         */

        const events = buffer.split("\n\n");

        /**
         * Keep incomplete data for the next chunk.
         */

        buffer = events.pop() || "";

        /**
         * ======================================================
         * PROCESS STREAM EVENTS
         * ======================================================
         */

        for (const event of events) {
          const lines = event.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) {
              continue;
            }

            const jsonText = line.slice(6);

            let streamData;

            try {
              streamData = JSON.parse(jsonText);
            } catch (error) {
              console.error("Failed to parse streaming data:", error);

              continue;
            }

            /**
             * ==================================================
             * USER MESSAGE CONFIRMED
             * ==================================================
             */

            if (streamData.type === "user_message") {
              setMessages((previous) =>
                previous.map((item) =>
                  item.temporary &&
                  item.sender === "user" &&
                  item.text === cleanMessage
                    ? {
                        id: streamData.message._id,
                        sender: "user",
                        text: streamData.message.content,
                      }
                    : item,
                ),
              );
            }

            /**
             * ==================================================
             * AI TEXT CHUNK
             * ==================================================
             */

            if (streamData.type === "text") {
              setMessages((previous) =>
                previous.map((item) =>
                  item.id === temporaryAIMessage.id
                    ? {
                        ...item,
                        text: item.text + streamData.text,
                      }
                    : item,
                ),
              );
            }

            /**
             * ==================================================
             * STREAM COMPLETE
             * ==================================================
             */

            if (streamData.type === "done") {
              streamFinished = true;

              setMessages((previous) =>
                previous.map((item) =>
                  item.id === temporaryAIMessage.id
                    ? {
                        id: streamData.message._id,
                        sender: "ai",
                        text: streamData.message.content,
                        streaming: false,
                      }
                    : item,
                ),
              );
            }

            /**
             * ==================================================
             * STREAM ERROR
             * ==================================================
             */

            if (streamData.type === "error") {
              throw new Error(
                streamData.message || "Failed to stream AI response",
              );
            }
          }
        }

        /**
         * Stop reading when the server closes the stream.
         */

        if (done) {
          break;
        }
      }

      /**
       * ========================================================
       * PROCESS FINAL BUFFER
       * ========================================================
       */

      if (buffer.trim()) {
        const lines = buffer.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const jsonText = line.slice(6);

          try {
            const streamData = JSON.parse(jsonText);

            if (streamData.type === "done") {
              setMessages((previous) =>
                previous.map((item) =>
                  item.id === temporaryAIMessage.id
                    ? {
                        id: streamData.message._id,
                        sender: "ai",
                        text: streamData.message.content,
                        streaming: false,
                      }
                    : item,
                ),
              );
            }
          } catch (error) {
            console.error("Failed to parse final streaming data:", error);
          }
        }
      }
    } catch (error) {
      console.error("Send message error:", error);

      /**
       * Remove temporary AI message if streaming failed.
       */

      setMessages((previous) =>
        previous.filter(
          (item) => !(item.temporary && item.sender === "ai" && item.streaming),
        ),
      );

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

    // Close sidebar on mobile when selecting a quick action
    setIsSidebarOpen(false);
  }

  function handleNewChat() {
    setMessages([]);
    setMessage("");
    setConversationId(null);
    setMessageError("");
    setActiveTool("chat");

    // Close sidebar on mobile when starting a new chat
    setIsSidebarOpen(false);
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
    // Close sidebar on mobile when opening settings
    setIsSidebarOpen(false);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  const displayName = user?.name || "User";
  const userEmail = user?.email || "NexusAI user";

  return (
    <main className="nexus-app">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {isSidebarOpen && (
        <div className="nexus-mobile-overlay" onClick={closeSidebar} />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`nexus-sidebar ${isSidebarOpen ? "nexus-sidebar-open" : ""}`}
      >
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
                onClick={() => {
                  setActiveTool(tool.id);
                  setIsSidebarOpen(false); // Close sidebar on mobile
                }}
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

        {/* SIDEBAR BOTTOM */}
        <div className="nexus-sidebar-bottom">
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
          {/* HAMBURGER BUTTON */}
          <button
            type="button"
            className="nexus-hamburger-button"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

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

            <button
              type="button"
              className="nexus-header-button nexus-mobile-settings"
              onClick={handleSettings}
              title="Settings"
            >
              ⚙️
            </button>

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

        {/* WORKSPACE */}
        <section className="nexus-workspace">
          {messages.length === 0 ? (
            <div className="nexus-dashboard">
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

                    <div className="nexus-message-bubble">
                      {item.text}

                      {item.streaming && (
                        <span
                          className="nexus-streaming-orb"
                          aria-label="NexusAI is responding"
                        >
                          ◉
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Invisible element used to keep the chat scrolled to the bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* MESSAGE COMPOSER */}
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

      {/* SETTINGS MODAL */}
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
