import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { emitRealtimeEvent } from '../utils/eventStore';

const router = Router();

// Get contact messages (Admin only)
router.get('/contact', [authenticateToken, requireAdmin], async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      include: {
        center: {
          select: { id: true, name: true }
        },
        sender: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedMessages = messages.map(message => ({
      id: message.id,
      centerName: message.center.name,
      centerId: message.centerId,
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      subject: message.subject,
      message: message.message,
      inquiryType: message.inquiryType,
      timestamp: message.createdAt,
      status: message.status.toLowerCase()
    }));

    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send contact message
router.post('/contact', [
  authenticateToken,
  body('centerId').isString(),
  body('subject').trim().isLength({ min: 5 }),
  body('message').trim().isLength({ min: 10 }),
  body('inquiryType').isString()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { centerId, subject, message, inquiryType } = req.body;

    // Verify center exists
    const center = await prisma.communityCenter.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        centerId,
        senderUserId: req.user!.id,
        senderName: req.user!.name,
        senderEmail: req.user!.email,
        subject,
        message,
        inquiryType,
        status: 'PENDING'
      }
    });

    // Emit real-time event for admin notifications
    emitRealtimeEvent('new-contact-message', {
      id: contactMessage.id,
      centerName: center.name,
      centerId: contactMessage.centerId,
      senderName: contactMessage.senderName,
      senderEmail: contactMessage.senderEmail,
      subject: contactMessage.subject,
      inquiryType: contactMessage.inquiryType,
      timestamp: contactMessage.createdAt
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactMessage: {
        id: contactMessage.id,
        centerName: center.name,
        centerId: contactMessage.centerId,
        senderName: contactMessage.senderName,
        senderEmail: contactMessage.senderEmail,
        subject: contactMessage.subject,
        message: contactMessage.message,
        inquiryType: contactMessage.inquiryType,
        timestamp: contactMessage.createdAt,
        status: contactMessage.status.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Send contact message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get message threads for a center
router.get('/threads/:centerId', [authenticateToken], async (req: AuthRequest, res: Response) => {
  try {
    const { centerId } = req.params;

    // Verify user has access to this center (admin or center manager)
    if (req.user!.role !== 'ADMIN') {
      const center = await prisma.communityCenter.findFirst({
        where: {
          id: centerId,
          managerId: req.user!.id
        }
      });

      if (!center) {
        return res.status(403).json({ error: 'Access denied to this center' });
      }
    }

    const threads = await prisma.messageThread.findMany({
      where: {
        participants: {
          some: { id: centerId }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { lastActivity: 'desc' }
    });

    const transformedThreads = threads.map(thread => ({
      id: thread.id,
      participants: thread.participants.map(p => p.id),
      participantNames: thread.participants.map(p => p.name),
      subject: thread.subject,
      lastMessage: thread.messages[0] ? {
        id: thread.messages[0].id,
        threadId: thread.messages[0].threadId,
        senderId: thread.messages[0].senderId,
        senderName: thread.messages[0].sender.name,
        content: thread.messages[0].content,
        timestamp: thread.messages[0].createdAt,
        read: thread.messages[0].read
      } : undefined,
      lastActivity: thread.lastActivity,
      messageCount: thread.messageCount
    }));

    res.json({ threads: transformedThreads });
  } catch (error) {
    console.error('Get message threads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages in a thread
router.get('/threads/:threadId/messages', [authenticateToken], async (req: AuthRequest, res: Response) => {
  try {
    const { threadId } = req.params;

    // Verify user has access to this thread
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            OR: [
              { managerId: req.user!.id },
              ...(req.user!.role === 'ADMIN' ? [{}] : [])
            ]
          }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found or access denied' });
    }

    const messages = await prisma.centerMessage.findMany({
      where: { threadId },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const transformedMessages = messages.map(message => ({
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      senderName: message.sender.name,
      content: message.content,
      timestamp: message.createdAt,
      read: message.read
    }));

    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message to thread
router.post('/threads/:threadId/messages', [
  authenticateToken,
  body('content').trim().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { threadId } = req.params;
    const { content } = req.body;

    // Find a center managed by this user to send from
    const senderCenter = await prisma.communityCenter.findFirst({
      where: {
        OR: [
          { managerId: req.user!.id },
          ...(req.user!.role === 'ADMIN' ? [{ verified: true }] : [])
        ]
      }
    });

    if (!senderCenter) {
      return res.status(403).json({ error: 'No center found to send message from' });
    }

    // Verify thread exists and user has access
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { id: senderCenter.id }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found or access denied' });
    }

    const message = await prisma.centerMessage.create({
      data: {
        threadId,
        senderId: senderCenter.id,
        content,
        read: false
      }
    });

    // Update thread activity and message count
    await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        lastActivity: new Date(),
        messageCount: { increment: 1 }
      }
    });

    // Emit real-time event for new message
    emitRealtimeEvent('new-message', {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      senderName: senderCenter.name,
      content: message.content,
      timestamp: message.createdAt,
      read: message.read
    });

    res.status(201).json({
      message: 'Message sent successfully',
      centerMessage: {
        id: message.id,
        threadId: message.threadId,
        senderId: message.senderId,
        senderName: senderCenter.name,
        content: message.content,
        timestamp: message.createdAt,
        read: message.read
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new message thread
router.post('/threads', [
  authenticateToken,
  body('participantIds').isArray().isLength({ min: 2 }),
  body('subject').trim().isLength({ min: 5 }),
  body('initialMessage').trim().isLength({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantIds, subject, initialMessage } = req.body;

    // Find sender center
    const senderCenter = await prisma.communityCenter.findFirst({
      where: {
        OR: [
          { managerId: req.user!.id },
          ...(req.user!.role === 'ADMIN' ? [{ verified: true }] : [])
        ]
      }
    });

    if (!senderCenter) {
      return res.status(403).json({ error: 'No center found to send message from' });
    }

    // Verify all participants are verified centers
    const participants = await prisma.communityCenter.findMany({
      where: {
        id: { in: participantIds },
        verified: true
      }
    });

    if (participants.length !== participantIds.length) {
      return res.status(400).json({ error: 'Some participants are not verified centers' });
    }

    // Create thread
    const thread = await prisma.messageThread.create({
      data: {
        subject,
        lastActivity: new Date(),
        messageCount: 1,
        participants: {
          connect: participantIds.map((id: string) => ({ id }))
        }
      }
    });

    // Create initial message
    const message = await prisma.centerMessage.create({
      data: {
        threadId: thread.id,
        senderId: senderCenter.id,
        content: initialMessage,
        read: false
      }
    });

    res.status(201).json({
      message: 'Thread created successfully',
      thread: {
        id: thread.id,
        participants: participantIds,
        participantNames: participants.map(p => p.name),
        subject: thread.subject,
        lastMessage: {
          id: message.id,
          threadId: message.threadId,
          senderId: message.senderId,
          senderName: senderCenter.name,
          content: message.content,
          timestamp: message.createdAt,
          read: message.read
        },
        lastActivity: thread.lastActivity,
        messageCount: thread.messageCount
      }
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;