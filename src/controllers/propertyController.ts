import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { zoneDigestService } from '../services/zoneDigestService';

export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      propertyType,
      furnishingStatus,
      monthlyRent, 
      bedrooms, 
      bathrooms, 
      area, 
      address,
      photos,
      // Financial Information
      securityDeposit,
      commission,
      dewaDeposit,
      paymentFrequency,
      noticePeriod,
      // Property Details
      floorNumber,
      totalFloors,
      parkingSpaces,
      balcony,
      yearBuilt,
      // Utilities
      acType,
      chillerType,
      internetIncluded,
      dewaIncluded,
      waterIncluded,
      kitchenAppliances,
      washingMachine,
      // Building Amenities
      swimmingPool,
      gym,
      security24,
      maidRoom,
      studyRoom,
      // Rules
      petsAllowed,
      smokingAllowed,
      tenantType,
      minimumStay,
      nationality,
      gender,
      // Legal
      reraPermit,
      municipalityNo,
      titleDeedNo,
      landlordId,
      // Additional
      viewType,
      maintenanceContact,
      emergencyContact,
    } = req.body;

    if (!title || !monthlyRent || !bedrooms || !bathrooms || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        propertyType: propertyType || 'APARTMENT',
        furnishingStatus: furnishingStatus || 'UNFURNISHED',
        monthlyRent: parseInt(monthlyRent),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: area ? parseInt(area) : null,
        address,
        photos: photos || [],
        ownerId: req.userId!,
        // Set new properties as public and available by default
        isPublic: true,
        availabilityStatus: 'AVAILABLE',
        // Financial Information
        securityDeposit: securityDeposit ? parseInt(securityDeposit) : null,
        paymentFrequency: paymentFrequency ? parseInt(paymentFrequency) : 12,
        noticePeriod: noticePeriod ? parseInt(noticePeriod) : 30,
        // Property Details
        floorNumber: floorNumber ? parseInt(floorNumber) : null,
        totalFloors: totalFloors ? parseInt(totalFloors) : null,
        parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : 0,
        balcony: balcony || false,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        // Utilities
        acType: acType || 'SPLIT',
        chillerType: chillerType || 'PAID',
        internetIncluded: internetIncluded || false,
        dewaIncluded: dewaIncluded || false,
        waterIncluded: waterIncluded || false,
        kitchenAppliances: kitchenAppliances || false,
        washingMachine: washingMachine || false,
        // Building Amenities
        swimmingPool: swimmingPool || false,
        gym: gym || false,
        security24: security24 || false,
        maidRoom: maidRoom || false,
        studyRoom: studyRoom || false,
        // Rules
        petsAllowed: petsAllowed || false,
        smokingAllowed: smokingAllowed || false,
        tenantType: tenantType || 'ANY',
        minimumStay: minimumStay ? parseInt(minimumStay) : 12,
        nationality: nationality || null,
        gender: gender || 'ANY',
        // Legal
        reraPermit: reraPermit || null,
        municipalityNo: municipalityNo || null,
        titleDeedNo: titleDeedNo || null,
        landlordId: landlordId || null,
        // Additional
        viewType: viewType || null,
        maintenanceContact: maintenanceContact || null,
        emergencyContact: emergencyContact || null,
      },
    });

    // Add to zone notifications if property is available
    if (property.isPublic && property.availabilityStatus === 'AVAILABLE' && address) {
      try {
        // Convert address to zone name (normalized for consistency)
        const zoneName = address.toLowerCase().replace(/\s+/g, '-');
        await zoneDigestService.addPropertyToPendingNotifications(property.id, zoneName);
        console.log(`📝 Added property ${property.id} to pending zone notifications for ${zoneName}`);
      } catch (notificationError) {
        console.error('Failed to add property to zone notifications:', notificationError);
        // Don't fail the entire property creation if notification fails
      }
    }

    res.status(201).json({
      message: 'Property created successfully',
      property,
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.body;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: req.userId! },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const rental = await prisma.rentalRelationship.create({
      data: {
        propertyId,
        landlordId: req.userId!,
        tenantId: req.userId!, // Temporary
        startDate: new Date(),
        monthlyRent: property.monthlyRent,
        status: 'PENDING',
        inviteCode,
      },
    });

    res.json({
      message: 'Invite code generated',
      inviteCode,
      rentalId: rental.id,
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;

    const rental = await prisma.rentalRelationship.findUnique({
      where: { inviteCode },
      include: { 
        property: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });

    if (!rental || rental.status !== 'PENDING') {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    res.json({
      valid: true,
      rental: {
        id: rental.id,
        monthlyRent: rental.monthlyRent,
        property: {
          id: rental.property.id,
          title: rental.property.title,
          address: rental.property.address,
          description: rental.property.description,
          paymentDueDay: rental.property.paymentDueDay,
          gracePeriod: rental.property.gracePeriodDays,
          bedrooms: rental.property.bedrooms,
          bathrooms: rental.property.bathrooms,
          area: rental.property.area
        },
        landlord: rental.landlord
      }
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;

    const rental = await prisma.rentalRelationship.findUnique({
      where: { inviteCode },
      include: { property: true },
    });

    if (!rental || rental.status !== 'PENDING') {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const updatedRental = await prisma.rentalRelationship.update({
      where: { id: rental.id },
      data: {
        tenantId: req.userId!,
        status: 'ACTIVE',
      },
      include: { 
        property: true,
        tenant: true
      },
    });

    // Send notification to landlord about new tenant joining
    if (updatedRental.tenant) {
      const { NotificationService } = await import('../services/notificationService');
      await NotificationService.sendNewTenantJoinedNotification(
        updatedRental.landlordId,
        updatedRental.tenant.name,
        updatedRental.property.title,
        updatedRental.propertyId
      );
    }

    res.json({
      message: 'Successfully connected to property',
      rental: updatedRental,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePaymentSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentDueDay, gracePeriodDays } = req.body;
    const userId = req.userId!;

    if (!paymentDueDay || paymentDueDay < 1 || paymentDueDay > 31) {
      return res.status(400).json({ error: 'Payment due day must be between 1 and 31' });
    }

    if (gracePeriodDays < 0 || gracePeriodDays > 30) {
      return res.status(400).json({ error: 'Grace period must be between 0 and 30 days' });
    }

    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id, ownerId: userId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        paymentDueDay: parseInt(paymentDueDay),
        gracePeriodDays: parseInt(gracePeriodDays),
      },
    });

    res.json({
      message: 'Payment settings updated successfully',
      property: updatedProperty,
    });
  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
};

export const getProperties = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  console.log('🏠 Getting properties for user:', req.userId);
  try {
    const userLookupStart = Date.now();
    const user = await prisma.user.findUnique({
      where: { id: req.userId! }
    });
    console.log('👤 User found:', user ? `${user.name} (${user.userType})` : 'null', `(${Date.now() - userLookupStart}ms)`);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let properties;
    if (user.userType === 'LANDLORD') {
      console.log('🏠 Fetching properties for landlord...');
      const propertiesQueryStart = Date.now();
      properties = await prisma.property.findMany({
        where: { ownerId: req.userId! },
        include: {
          rentals: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              contractStartDate: true,
              contractEndDate: true,
              contractDuration: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              endRequest: {
                where: {
                  status: 'PENDING'
                },
                select: {
                  id: true,
                  status: true,
                  requestedBy: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      console.log('⚡ Properties query completed:', `${Date.now() - propertiesQueryStart}ms`);
    } else {
      const propertiesQueryStart = Date.now();
      const rentals = await prisma.rentalRelationship.findMany({
        where: { 
          tenantId: req.userId!,
          status: { in: ['ACTIVE', 'ENDING'] }
        },
        select: {
          id: true,
          status: true,
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              monthlyRent: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
              propertyType: true,
              photos: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          endRequest: {
            where: {
              status: 'PENDING'
            },
            select: {
              id: true,
              status: true,
              requestedBy: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      console.log('⚡ Rentals query completed:', `${Date.now() - propertiesQueryStart}ms`);
      properties = rentals.map(rental => ({
        ...rental.property,
        rentalStatus: rental.status,
        rentalId: rental.id,
        endRequest: rental.endRequest
      }));
    }

    console.log('✅ Returning properties:', properties?.length || 0, 'properties found', `(Total: ${Date.now() - startTime}ms)`);
    res.json({ properties });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔧 UPDATE PROPERTY REQUEST:', req.params, req.body);
    const { propertyId } = req.params;
    const { 
      title, 
      description, 
      propertyType,
      furnishingStatus,
      monthlyRent, 
      bedrooms, 
      bathrooms, 
      area, 
      address,
      photos,
      // Financial Information
      securityDeposit,
      commission,
      dewaDeposit,
      paymentFrequency,
      noticePeriod,
      // Property Details
      floorNumber,
      totalFloors,
      parkingSpaces,
      balcony,
      yearBuilt,
      // Utilities
      acType,
      chillerType,
      internetIncluded,
      dewaIncluded,
      waterIncluded,
      kitchenAppliances,
      washingMachine,
      // Building Amenities
      swimmingPool,
      gym,
      security24,
      maidRoom,
      studyRoom,
      // Rules
      petsAllowed,
      smokingAllowed,
      tenantType,
      minimumStay,
      nationality,
      gender,
      // Legal
      reraPermit,
      municipalityNo,
      titleDeedNo,
      landlordId,
      // Additional
      viewType,
      maintenanceContact,
      emergencyContact,
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Verify property belongs to the landlord
    const existingProperty = await prisma.property.findFirst({
      where: { 
        id: propertyId, 
        ownerId: req.userId! 
      }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found or you do not have permission to edit it' });
    }

    // Update only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (furnishingStatus !== undefined) updateData.furnishingStatus = furnishingStatus;
    if (monthlyRent !== undefined) updateData.monthlyRent = parseInt(monthlyRent);
    if (bedrooms !== undefined) updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms !== undefined) updateData.bathrooms = parseInt(bathrooms);
    if (area !== undefined) updateData.area = area ? parseInt(area) : null;
    if (address !== undefined) updateData.address = address;
    if (photos !== undefined) updateData.photos = photos;

    // Financial Information
    if (securityDeposit !== undefined) updateData.securityDeposit = securityDeposit ? parseInt(securityDeposit) : null;
    if (commission !== undefined) updateData.commission = parseInt(commission);
    if (dewaDeposit !== undefined) updateData.dewaDeposit = parseInt(dewaDeposit);
    if (paymentFrequency !== undefined) updateData.paymentFrequency = parseInt(paymentFrequency);
    if (noticePeriod !== undefined) updateData.noticePeriod = parseInt(noticePeriod);
    
    // Property Details
    if (floorNumber !== undefined) updateData.floorNumber = floorNumber ? parseInt(floorNumber) : null;
    if (totalFloors !== undefined) updateData.totalFloors = totalFloors ? parseInt(totalFloors) : null;
    if (parkingSpaces !== undefined) updateData.parkingSpaces = parseInt(parkingSpaces);
    if (balcony !== undefined) updateData.balcony = balcony;
    if (yearBuilt !== undefined) updateData.yearBuilt = yearBuilt ? parseInt(yearBuilt) : null;
    
    // Utilities
    if (acType !== undefined) updateData.acType = acType;
    if (chillerType !== undefined) updateData.chillerType = chillerType;
    if (internetIncluded !== undefined) updateData.internetIncluded = internetIncluded;
    if (dewaIncluded !== undefined) updateData.dewaIncluded = dewaIncluded;
    if (waterIncluded !== undefined) updateData.waterIncluded = waterIncluded;
    if (kitchenAppliances !== undefined) updateData.kitchenAppliances = kitchenAppliances;
    if (washingMachine !== undefined) updateData.washingMachine = washingMachine;
    
    // Building Amenities
    if (swimmingPool !== undefined) updateData.swimmingPool = swimmingPool;
    if (gym !== undefined) updateData.gym = gym;
    if (security24 !== undefined) updateData.security24 = security24;
    if (maidRoom !== undefined) updateData.maidRoom = maidRoom;
    if (studyRoom !== undefined) updateData.studyRoom = studyRoom;
    
    // Rules
    if (petsAllowed !== undefined) updateData.petsAllowed = petsAllowed;
    if (smokingAllowed !== undefined) updateData.smokingAllowed = smokingAllowed;
    if (tenantType !== undefined) updateData.tenantType = tenantType;
    if (minimumStay !== undefined) updateData.minimumStay = parseInt(minimumStay);
    if (nationality !== undefined) updateData.nationality = nationality;
    if (gender !== undefined) updateData.gender = gender;
    
    // Legal
    if (reraPermit !== undefined) updateData.reraPermit = reraPermit;
    if (municipalityNo !== undefined) updateData.municipalityNo = municipalityNo;
    if (titleDeedNo !== undefined) updateData.titleDeedNo = titleDeedNo;
    if (landlordId !== undefined) updateData.landlordId = landlordId;
    
    // Additional
    if (viewType !== undefined) updateData.viewType = viewType;
    if (maintenanceContact !== undefined) updateData.maintenanceContact = maintenanceContact;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

    console.log('🔧 UPDATE DATA:', updateData);
    
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        rentals: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    console.log('✅ PROPERTY UPDATED SUCCESSFULLY:', updatedProperty.id, updatedProperty.address);

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty,
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchAvailableProperties = async (req: AuthRequest, res: Response) => {
  try {
    const { location, minBedrooms, maxBedrooms, minPrice, maxPrice } = req.query;
    
    console.log('🔍 SEARCH REQUEST:', req.query);

    // Build where clause for filtering  
    const whereClause: any = {
      isPublic: true,
      OR: [
        { availabilityStatus: 'AVAILABLE' },
        { availabilityStatus: 'ENDING_SOON' },
        { availabilityStatus: 'AVAILABLE_SOON' }
      ]
    };

    // Add location filter if provided
    if (location) {
      whereClause.address = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    // Add bedroom filters
    if (minBedrooms || maxBedrooms) {
      whereClause.bedrooms = {};
      if (minBedrooms) whereClause.bedrooms.gte = parseInt(minBedrooms as string);
      if (maxBedrooms) whereClause.bedrooms.lte = parseInt(maxBedrooms as string);
    }

    // Add price filters
    if (minPrice || maxPrice) {
      whereClause.monthlyRent = {};
      if (minPrice) whereClause.monthlyRent.gte = parseInt(minPrice as string);
      if (maxPrice) whereClause.monthlyRent.lte = parseInt(maxPrice as string);
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rentals: {
          where: {
            status: 'ACTIVE'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${properties.length} available properties`);

    res.json({
      properties: properties.map(prop => ({
        ...prop,
        availability: prop.availabilityStatus || 'AVAILABLE',
        hasActiveTenant: prop.rentals.length > 0
      }))
    });
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
};

export const updatePropertyAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { isPublic, availabilityStatus, availabilityDays } = req.body;

    console.log('🔄 UPDATE AVAILABILITY REQUEST:', { propertyId, isPublic, availabilityStatus, availabilityDays });

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: req.userId!
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or unauthorized' });
    }

    const updateData: any = {
      isPublic: isPublic !== undefined ? isPublic : property.isPublic,
      availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : property.availabilityStatus,
      availabilityDays: availabilityDays !== undefined ? availabilityDays : property.availabilityDays
    };

    // Store only the availability status and days

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData
    });

    console.log('✅ Property availability updated:', updatedProperty.id);

    // Check if property became available for zone notifications
    const wasAvailable = property.isPublic && property.availabilityStatus === 'AVAILABLE';
    const isNowAvailable = updatedProperty.isPublic && updatedProperty.availabilityStatus === 'AVAILABLE';
    
    if (!wasAvailable && isNowAvailable && updatedProperty.address) {
      try {
        // Property just became available, add to pending notifications
        const zoneName = updatedProperty.address.toLowerCase().replace(/\s+/g, '-');
        await zoneDigestService.addPropertyToPendingNotifications(updatedProperty.id, zoneName);
        console.log(`📝 Property ${updatedProperty.id} became available - added to pending zone notifications for ${zoneName}`);
      } catch (notificationError) {
        console.error('Failed to add property to zone notifications:', notificationError);
        // Don't fail the entire update if notification fails
      }
    }

    res.json({
      message: 'Property availability updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update property availability' });
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    console.log('🗑️ DELETE PROPERTY REQUEST:', { propertyId, userId });

    // Verify property belongs to the landlord
    const property = await prisma.property.findFirst({
      where: { 
        id: propertyId, 
        ownerId: userId 
      },
      include: {
        rentals: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] }
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or you do not have permission to delete it' });
    }

    // Check if property has active tenants
    if (property.rentals.length > 0) {
      const activeRentals = property.rentals.filter(rental => rental.status === 'ACTIVE');
      const pendingRentals = property.rentals.filter(rental => rental.status === 'PENDING');
      
      let errorMessage = 'Cannot delete property with active connections. ';
      
      if (activeRentals.length > 0) {
        errorMessage += `Active tenant(s): ${activeRentals.map(r => r.tenant?.name || 'Unknown').join(', ')}. `;
      }
      
      if (pendingRentals.length > 0) {
        errorMessage += `Pending invitation(s) for tenant(s): ${pendingRentals.map(r => r.tenant?.name || 'Pending').join(', ')}. `;
      }
      
      errorMessage += 'Please end all rental relationships first.';

      return res.status(400).json({ 
        error: errorMessage,
        activeRentals: activeRentals.length,
        pendingRentals: pendingRentals.length,
        tenants: property.rentals.map(r => ({
          name: r.tenant?.name,
          email: r.tenant?.email,
          status: r.status
        }))
      });
    }

    // Delete all associated data in the correct order
    console.log('🗑️ Deleting associated data...');

    // First delete payments (they reference rental relationships)
    await prisma.payment.deleteMany({
      where: { 
        rental: {
          propertyId
        }
      }
    });
    console.log('✅ Payments deleted');

    // Delete end requests (they reference rental relationships)
    await prisma.endRequest.deleteMany({
      where: { 
        rental: {
          propertyId
        }
      }
    });
    console.log('✅ End requests deleted');

    // Delete messages (they reference property directly)
    await prisma.message.deleteMany({
      where: { propertyId }
    });
    console.log('✅ Messages deleted');

    // Delete payment date change requests (they reference property directly)
    await prisma.paymentDateChangeRequest.deleteMany({
      where: { propertyId }
    });
    console.log('✅ Payment date change requests deleted');

    // Then delete rental relationships  
    await prisma.rentalRelationship.deleteMany({
      where: { propertyId }
    });
    console.log('✅ Rental relationships deleted');

    // Delete any notifications related to this property
    await prisma.notification.deleteMany({
      where: {
        data: {
          path: ['propertyId'],
          equals: propertyId
        }
      }
    });
    console.log('✅ Notifications deleted');

    // Finally delete the property
    await prisma.property.delete({
      where: { id: propertyId }
    });
    console.log('✅ Property deleted');

    console.log('✅ Property deleted successfully:', propertyId);

    res.json({
      message: 'Property deleted successfully',
      propertyId
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
};
