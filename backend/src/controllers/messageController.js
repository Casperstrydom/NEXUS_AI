import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { generateAIResponse } from "../services/aiService.js";

/*
  POST /api/conversations/:id/messages

  Create a user message and generate an AI response
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

    /*
      ========================================
      SAVE USER MESSAGE
      ========================================
    */

    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: content.trim(),
    });

    /*
      ========================================
      GET CONVERSATION HISTORY
      ========================================
    */

    const previousMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    /*
      Convert MongoDB messages into the format
      expected by the AI service.
    */

    const conversationHistory = previousMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    /*
      ========================================
      GENERATE AI RESPONSE
      ========================================
    */

    const aiResponse = await generateAIResponse(
      content.trim(),
      conversationHistory.slice(0, -1),
    );

    /*
      ========================================
      SAVE AI MESSAGE
      ========================================
    */

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });

    /*
      ========================================
      UPDATE CONVERSATION
      ========================================
    */

    conversation.updatedAt = new Date();

    await conversation.save();

    /*
      ========================================
      RETURN RESPONSE
      ========================================
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

/*
  GET /api/conversations/:id/messages

  Get all messages belonging to a conversation
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
