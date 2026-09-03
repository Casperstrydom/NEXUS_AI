import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { generateAIResponse, streamAIResponse } from "../services/aiService.js";

/**
 * ============================================================
 * POST /api/conversations/:id/messages
 * Create a user message and generate a normal AI response
 * ============================================================
 */

export const createMessage = async (req, res) => {
  try {
    const { content } = req.body;

    // Check message content
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Find the conversation belonging to the authenticated user
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    /**
     * ========================================================
     * SAVE USER MESSAGE
     * ========================================================
     */

    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: content.trim(),
    });

    /**
     * ========================================================
     * GET CONVERSATION HISTORY
     * ========================================================
     */

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    /**
     * Convert MongoDB messages into the format
     * expected by the AI service.
     */

    const conversationHistory = previousMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    /**
     * ========================================================
     * GENERATE AI RESPONSE
     * ========================================================
     */

    const aiResponse = await generateAIResponse(
      content.trim(),
      conversationHistory.slice(0, -1),
    );

    /**
     * ========================================================
     * SAVE AI MESSAGE
     * ========================================================
     */

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });

    /**
     * ========================================================
     * UPDATE CONVERSATION
     * ========================================================
     */

    conversation.updatedAt = new Date();
    await conversation.save();

    /**
     * ========================================================
     * RETURN RESPONSE
     * ========================================================
     */

    return res.status(201).json({
      success: true,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Create message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create message",
    });
  }
};

/**
 * ============================================================
 * POST /api/conversations/:id/messages/stream
 * Create a user message and stream the AI response
 * ============================================================
 */

export const createStreamingMessage = async (req, res) => {
  try {
    const { content } = req.body;

    // Check message content
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    /**
     * ========================================================
     * FIND CONVERSATION
     * ========================================================
     */

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    /**
     * ========================================================
     * SAVE USER MESSAGE
     * ========================================================
     */

    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: content.trim(),
    });

    /**
     * ========================================================
     * GET CONVERSATION HISTORY
     * ========================================================
     */

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    /**
     * Convert MongoDB messages into the format
     * expected by the AI service.
     */

    const conversationHistory = previousMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    /**
     * ========================================================
     * START AI STREAM
     * ========================================================
     */

    const stream = await streamAIResponse(
      content.trim(),
      conversationHistory.slice(0, -1),
    );

    /**
     * ========================================================
     * SET STREAMING RESPONSE HEADERS
     * ========================================================
     */

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Helps send the headers immediately
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    /**
     * ========================================================
     * SEND USER MESSAGE TO FRONTEND
     * ========================================================
     */

    res.write(
      `data: ${JSON.stringify({
        type: "user_message",
        message: userMessage,
      })}\n\n`,
    );

    /**
     * ========================================================
     * BUILD COMPLETE AI RESPONSE
     * ========================================================
     */

    let fullResponse = "";

    /**
     * ========================================================
     * READ OPENAI STREAM
     * ========================================================
     */

    for await (const event of stream) {
      /**
       * OpenAI sends text pieces through
       * response.output_text.delta
       */

      if (event.type === "response.output_text.delta") {
        const text = event.delta;

        // Add chunk to complete response
        fullResponse += text;

        /**
         * Send the chunk immediately to the frontend
         */

        res.write(
          `data: ${JSON.stringify({
            type: "text",
            text,
          })}\n\n`,
        );
      }
    }

    /**
     * ========================================================
     * SAVE COMPLETE AI RESPONSE TO MONGODB
     * ========================================================
     */

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: fullResponse,
    });

    /**
     * ========================================================
     * UPDATE CONVERSATION
     * ========================================================
     */

    conversation.updatedAt = new Date();
    await conversation.save();

    /**
     * ========================================================
     * TELL FRONTEND STREAMING IS COMPLETE
     * ========================================================
     */

    res.write(
      `data: ${JSON.stringify({
        type: "done",
        message: assistantMessage,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error("Streaming message error:", error);

    /**
     * If headers haven't been sent yet,
     * return a normal HTTP error.
     */

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to stream message",
      });
    }

    /**
     * If streaming has already started,
     * send an error event through the stream.
     */

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "Failed to stream AI response",
      })}\n\n`,
    );

    res.end();
  }
};

/**
 * ============================================================
 * GET /api/conversations/:id/messages
 * Get all messages belonging to a conversation
 * ============================================================
 */

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get messages",
    });
  }
};
