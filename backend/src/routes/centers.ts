import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest, FilterCriteria } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { emitRealtimeEvent } from '../utils/eventStore';

const router = Router();

// Get all centers with filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      searchQuery,
      services,
      locations,
      verificationStatus,
      connectionStatus,
      addedBy
    } = req.query as any;

    let whereClause: any = {};

    // Search query filter
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { location: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    // Services filter
    if (services) {
      const serviceArray = Array.isArray(services) ? services : services.split(',');
      whereClause.services = {
        hasSome: serviceArray
      };
    }

    // Location filter
    if (locations) {
      const locationArray = Array.isArray(locations) ? locations : locations.split(',');
      whereClause.location = {
        in: locationArray
      };
    }

    // Verification status filter
    if (verificationStatus && verificationStatus !== 'all') {
      whereClause.verified = verificationStatus === 'verified';
    }

    // Get centers with connections
    const centers = await prisma.communityCenter.findMany({
      where: whereClause,
      include: {
        connectionsFrom: {
          include: {
            centerB: {
              select: { id: true, name: true }
            }
          }
        },
        connectionsTo: {
          include: {
            centerA: {
              select: { id: true, name: true }
            }
          }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Transform data to match frontend interface
    const transformedCenters = centers.map(center => {
      const connections = [
        ...center.connectionsFrom.map(conn => conn.centerB.id),
        ...center.connectionsTo.map(conn => conn.centerA.id)
      ];

      return {
        id: center.id,
        name: center.name,
        location: center.location,
        coordinates: { lat: center.latitude, lng: center.longitude },
        services: center.services,
        description: center.description,
        verified: center.verified,
        connections,
        addedBy: center.manager?.id ? 'admin' : 'visitor',
        contactInfo: {
          phone: center.phone,
          email: center.email,
          website: center.website
        }
      };
    });

    // Apply connection status filter after transformation
    let filteredCenters = transformedCenters;
    if (connectionStatus && connectionStatus !== 'all') {
      if (connectionStatus === 'connected') {
        filteredCenters = transformedCenters.filter(center => center.connections.length > 0);
      } else if (connectionStatus === 'standalone') {
        filteredCenters = transformedCenters.filter(center => center.connections.length === 0);
      }
    }

    res.json({ centers: filteredCenters });
  } catch (error) {
    console.error('Get centers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single center by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const center = await prisma.communityCenter.findUnique({
      where: { id },
      include: {
        connectionsFrom: {
          include: {
            centerB: {
              select: { id: true, name: true, location: true, verified: true }
            }
          }
        },
        connectionsTo: {
          include: {
            centerA: {
              select: { id: true, name: true, location: true, verified: true }
            }
          }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!center) {
      return res.status(404).json({ error: 'Center not found' });
    }

    const connections = [
      ...center.connectionsFrom.map(conn => conn.centerB.id),
      ...center.connectionsTo.map(conn => conn.centerA.id)
    ];

    const connectedCenters = [
      ...center.connectionsFrom.map(conn => conn.centerB),
      ...center.connectionsTo.map(conn => conn.centerA)
    ];

    const transformedCenter = {
      id: center.id,
      name: center.name,
      location: center.location,
      coordinates: { lat: center.latitude, lng: center.longitude },
      services: center.services,
      description: center.description,
      verified: center.verified,
      connections,
      connectedCenters,
      addedBy: center.manager?.id ? 'admin' : 'visitor',
      contactInfo: {
        phone: center.phone,
        email: center.email,
        website: center.website
      }
    };

    res.json({ center: transformedCenter });
  } catch (error) {
    console.error('Get center error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new center
router.post('/', [
  authenticateToken,
  body('name').trim().isLength({ min: 2 }),
  body('location').trim().isLength({ min: 5 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('services').isArray().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 10 }),
  body('phone').optional().isMobilePhone('any'),
  body('email').optional().isEmail(),
  body('website').optional().isURL()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      location,
      latitude,
      longitude,
      services,
      description,
      phone,
      email,
      website
    } = req.body;

    const center = await prisma.communityCenter.create({
      data: {
        name,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        services,
        description,
        phone,
        email,
        website,
        addedBy: req.user!.id,
        verified: req.user!.role === 'ADMIN',
        managerId: req.user!.role === 'ADMIN' ? req.user!.id : null
      }
    });

    res.status(201).json({
      message: 'Center created successfully',
      center: {
        id: center.id,
        name: center.name,
        location: center.location,
        coordinates: { lat: center.latitude, lng: center.longitude },
        services: center.services,
        description: center.description,
        verified: center.verified,
        connections: [],
        addedBy: req.user!.role === 'ADMIN' ? 'admin' : 'visitor',
        contactInfo: {
          phone: center.phone,
          email: center.email,
          website: center.website
        }
      }
    });
  } catch (error) {
    console.error('Create center error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify center (Admin only)
router.patch('/:id/verify', [authenticateToken, requireAdmin], async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const center = await prisma.communityCenter.update({
      where: { id },
      data: { verified: true }
    });

    // Emit real-time event for center verification
    emitRealtimeEvent('center-updated', {
      id: center.id,
      name: center.name,
      verified: center.verified,
      action: 'verified'
    });

    res.json({
      message: 'Center verified successfully',
      center
    });
  } catch (error) {
    console.error('Verify center error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect two centers
router.post('/connect', [
  authenticateToken,
  requireAdmin,
  body('center1Id').isString(),
  body('center2Id').isString()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { center1Id, center2Id } = req.body;

    if (center1Id === center2Id) {
      return res.status(400).json({ error: 'Cannot connect center to itself' });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { centerAId: center1Id, centerBId: center2Id },
          { centerAId: center2Id, centerBId: center1Id }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Centers are already connected' });
    }

    // Create connection
    const connection = await prisma.connection.create({
      data: {
        centerAId: center1Id,
        centerBId: center2Id
      }
    });

    res.status(201).json({
      message: 'Centers connected successfully',
      connection
    });
  } catch (error) {
    console.error('Connect centers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;