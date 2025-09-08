"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProperty = exports.updatePropertyAvailability = exports.searchAvailableProperties = exports.updateProperty = exports.getProperties = exports.updatePaymentSettings = exports.acceptInvite = exports.validateInvite = exports.generateInvite = exports.createProperty = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const createProperty = async (req, res) => {
    try {
        const { title, description, propertyType, furnishingStatus, monthlyRent, bedrooms, bathrooms, area, address, photos, 
        // Financial Information
        securityDeposit, commission, dewaDeposit, paymentFrequency, noticePeriod, 
        // Property Details
        floorNumber, totalFloors, parkingSpaces, balcony, yearBuilt, 
        // Utilities
        acType, chillerType, internetIncluded, dewaIncluded, waterIncluded, kitchenAppliances, washingMachine, 
        // Building Amenities
        swimmingPool, gym, security24, maidRoom, studyRoom, 
        // Rules
        petsAllowed, smokingAllowed, tenantType, minimumStay, nationality, gender, 
        // Legal
        reraPermit, municipalityNo, titleDeedNo, landlordId, 
        // Additional
        viewType, maintenanceContact, emergencyContact, } = req.body;
        if (!title || !monthlyRent || !bedrooms || !bathrooms || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const property = await prisma_1.prisma.property.create({
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
                ownerId: req.userId,
                // Set new properties as NOT AVAILABLE by default
                isPublic: false,
                availabilityStatus: null,
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
        // Send notifications to users interested in this zone
        // TODO: Temporarily commented until DB migration completes
        /*
        try {
          await sendZoneNotifications(property.address, property.title, property.id);
        } catch (notificationError) {
          console.error('Failed to send zone notifications:', notificationError);
          // Don't fail the property creation if notifications fail
        }
        */
        res.status(201).json({
            message: 'Property created successfully',
            property,
        });
    }
    catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createProperty = createProperty;
const generateInvite = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const property = await prisma_1.prisma.property.findFirst({
            where: { id: propertyId, ownerId: req.userId },
        });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        const inviteCode = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
        const rental = await prisma_1.prisma.rentalRelationship.create({
            data: {
                propertyId,
                landlordId: req.userId,
                tenantId: req.userId, // Temporary
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
    }
    catch (error) {
        console.error('Generate invite error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.generateInvite = generateInvite;
const validateInvite = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const rental = await prisma_1.prisma.rentalRelationship.findUnique({
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
    }
    catch (error) {
        console.error('Validate invite error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.validateInvite = validateInvite;
const acceptInvite = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const rental = await prisma_1.prisma.rentalRelationship.findUnique({
            where: { inviteCode },
            include: { property: true },
        });
        if (!rental || rental.status !== 'PENDING') {
            return res.status(404).json({ error: 'Invalid invite code' });
        }
        const updatedRental = await prisma_1.prisma.rentalRelationship.update({
            where: { id: rental.id },
            data: {
                tenantId: req.userId,
                status: 'ACTIVE',
            },
            include: { property: true },
        });
        res.json({
            message: 'Successfully connected to property',
            rental: updatedRental,
        });
    }
    catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.acceptInvite = acceptInvite;
const updatePaymentSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentDueDay, gracePeriodDays } = req.body;
        const userId = req.userId;
        if (!paymentDueDay || paymentDueDay < 1 || paymentDueDay > 31) {
            return res.status(400).json({ error: 'Payment due day must be between 1 and 31' });
        }
        if (gracePeriodDays < 0 || gracePeriodDays > 30) {
            return res.status(400).json({ error: 'Grace period must be between 0 and 30 days' });
        }
        // Verify ownership
        const property = await prisma_1.prisma.property.findFirst({
            where: { id, ownerId: userId },
        });
        if (!property) {
            return res.status(404).json({ error: 'Property not found or access denied' });
        }
        const updatedProperty = await prisma_1.prisma.property.update({
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
    }
    catch (error) {
        console.error('Update payment settings error:', error);
        res.status(500).json({ error: 'Failed to update payment settings' });
    }
};
exports.updatePaymentSettings = updatePaymentSettings;
const getProperties = async (req, res) => {
    console.log('🏠 Getting properties for user:', req.userId);
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId }
        });
        console.log('👤 User found:', user ? `${user.name} (${user.userType})` : 'null');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let properties;
        if (user.userType === 'LANDLORD') {
            console.log('🏠 Fetching properties for landlord...');
            properties = await prisma_1.prisma.property.findMany({
                where: { ownerId: req.userId },
                include: {
                    rentals: {
                        include: {
                            tenant: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            },
                            endRequest: {
                                where: {
                                    status: 'PENDING'
                                },
                                include: {
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
        }
        else {
            const rentals = await prisma_1.prisma.rentalRelationship.findMany({
                where: {
                    tenantId: req.userId,
                    status: { in: ['ACTIVE', 'ENDING'] }
                },
                include: {
                    property: {
                        include: {
                            owner: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    endRequest: {
                        where: {
                            status: 'PENDING'
                        },
                        include: {
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
            properties = rentals.map(rental => ({
                ...rental.property,
                rentalStatus: rental.status,
                rentalId: rental.id,
                endRequest: rental.endRequest
            }));
        }
        console.log('✅ Returning properties:', properties?.length || 0, 'properties found');
        res.json({ properties });
    }
    catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
};
exports.getProperties = getProperties;
const updateProperty = async (req, res) => {
    try {
        console.log('🔧 UPDATE PROPERTY REQUEST:', req.params, req.body);
        const { propertyId } = req.params;
        const { title, description, propertyType, furnishingStatus, monthlyRent, bedrooms, bathrooms, area, address, photos, 
        // Financial Information
        securityDeposit, commission, dewaDeposit, paymentFrequency, noticePeriod, 
        // Property Details
        floorNumber, totalFloors, parkingSpaces, balcony, yearBuilt, 
        // Utilities
        acType, chillerType, internetIncluded, dewaIncluded, waterIncluded, kitchenAppliances, washingMachine, 
        // Building Amenities
        swimmingPool, gym, security24, maidRoom, studyRoom, 
        // Rules
        petsAllowed, smokingAllowed, tenantType, minimumStay, nationality, gender, 
        // Legal
        reraPermit, municipalityNo, titleDeedNo, landlordId, 
        // Additional
        viewType, maintenanceContact, emergencyContact, } = req.body;
        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }
        // Verify property belongs to the landlord
        const existingProperty = await prisma_1.prisma.property.findFirst({
            where: {
                id: propertyId,
                ownerId: req.userId
            }
        });
        if (!existingProperty) {
            return res.status(404).json({ error: 'Property not found or you do not have permission to edit it' });
        }
        // Update only provided fields
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (propertyType !== undefined)
            updateData.propertyType = propertyType;
        if (furnishingStatus !== undefined)
            updateData.furnishingStatus = furnishingStatus;
        if (monthlyRent !== undefined)
            updateData.monthlyRent = parseInt(monthlyRent);
        if (bedrooms !== undefined)
            updateData.bedrooms = parseInt(bedrooms);
        if (bathrooms !== undefined)
            updateData.bathrooms = parseInt(bathrooms);
        if (area !== undefined)
            updateData.area = area ? parseInt(area) : null;
        if (address !== undefined)
            updateData.address = address;
        if (photos !== undefined)
            updateData.photos = photos;
        // Financial Information
        if (securityDeposit !== undefined)
            updateData.securityDeposit = securityDeposit ? parseInt(securityDeposit) : null;
        if (commission !== undefined)
            updateData.commission = parseInt(commission);
        if (dewaDeposit !== undefined)
            updateData.dewaDeposit = parseInt(dewaDeposit);
        if (paymentFrequency !== undefined)
            updateData.paymentFrequency = parseInt(paymentFrequency);
        if (noticePeriod !== undefined)
            updateData.noticePeriod = parseInt(noticePeriod);
        // Property Details
        if (floorNumber !== undefined)
            updateData.floorNumber = floorNumber ? parseInt(floorNumber) : null;
        if (totalFloors !== undefined)
            updateData.totalFloors = totalFloors ? parseInt(totalFloors) : null;
        if (parkingSpaces !== undefined)
            updateData.parkingSpaces = parseInt(parkingSpaces);
        if (balcony !== undefined)
            updateData.balcony = balcony;
        if (yearBuilt !== undefined)
            updateData.yearBuilt = yearBuilt ? parseInt(yearBuilt) : null;
        // Utilities
        if (acType !== undefined)
            updateData.acType = acType;
        if (chillerType !== undefined)
            updateData.chillerType = chillerType;
        if (internetIncluded !== undefined)
            updateData.internetIncluded = internetIncluded;
        if (dewaIncluded !== undefined)
            updateData.dewaIncluded = dewaIncluded;
        if (waterIncluded !== undefined)
            updateData.waterIncluded = waterIncluded;
        if (kitchenAppliances !== undefined)
            updateData.kitchenAppliances = kitchenAppliances;
        if (washingMachine !== undefined)
            updateData.washingMachine = washingMachine;
        // Building Amenities
        if (swimmingPool !== undefined)
            updateData.swimmingPool = swimmingPool;
        if (gym !== undefined)
            updateData.gym = gym;
        if (security24 !== undefined)
            updateData.security24 = security24;
        if (maidRoom !== undefined)
            updateData.maidRoom = maidRoom;
        if (studyRoom !== undefined)
            updateData.studyRoom = studyRoom;
        // Rules
        if (petsAllowed !== undefined)
            updateData.petsAllowed = petsAllowed;
        if (smokingAllowed !== undefined)
            updateData.smokingAllowed = smokingAllowed;
        if (tenantType !== undefined)
            updateData.tenantType = tenantType;
        if (minimumStay !== undefined)
            updateData.minimumStay = parseInt(minimumStay);
        if (nationality !== undefined)
            updateData.nationality = nationality;
        if (gender !== undefined)
            updateData.gender = gender;
        // Legal
        if (reraPermit !== undefined)
            updateData.reraPermit = reraPermit;
        if (municipalityNo !== undefined)
            updateData.municipalityNo = municipalityNo;
        if (titleDeedNo !== undefined)
            updateData.titleDeedNo = titleDeedNo;
        if (landlordId !== undefined)
            updateData.landlordId = landlordId;
        // Additional
        if (viewType !== undefined)
            updateData.viewType = viewType;
        if (maintenanceContact !== undefined)
            updateData.maintenanceContact = maintenanceContact;
        if (emergencyContact !== undefined)
            updateData.emergencyContact = emergencyContact;
        console.log('🔧 UPDATE DATA:', updateData);
        const updatedProperty = await prisma_1.prisma.property.update({
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
                                phone: true
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
    }
    catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProperty = updateProperty;
const searchAvailableProperties = async (req, res) => {
    try {
        const { location, minBedrooms, maxBedrooms, minPrice, maxPrice } = req.query;
        console.log('🔍 SEARCH REQUEST:', req.query);
        // Build where clause for filtering  
        const whereClause = {
            isPublic: true,
            OR: [
                { availabilityStatus: 'AVAILABLE' },
                { availabilityStatus: 'AVAILABLE_SOON' }
            ]
        };
        // Add location filter if provided
        if (location) {
            whereClause.address = {
                contains: location,
                mode: 'insensitive'
            };
        }
        // Add bedroom filters
        if (minBedrooms || maxBedrooms) {
            whereClause.bedrooms = {};
            if (minBedrooms)
                whereClause.bedrooms.gte = parseInt(minBedrooms);
            if (maxBedrooms)
                whereClause.bedrooms.lte = parseInt(maxBedrooms);
        }
        // Add price filters
        if (minPrice || maxPrice) {
            whereClause.monthlyRent = {};
            if (minPrice)
                whereClause.monthlyRent.gte = parseInt(minPrice);
            if (maxPrice)
                whereClause.monthlyRent.lte = parseInt(maxPrice);
        }
        const properties = await prisma_1.prisma.property.findMany({
            where: whereClause,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
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
    }
    catch (error) {
        console.error('Search properties error:', error);
        res.status(500).json({ error: 'Failed to search properties' });
    }
};
exports.searchAvailableProperties = searchAvailableProperties;
const updatePropertyAvailability = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { isPublic, availabilityStatus } = req.body;
        console.log('🔄 UPDATE AVAILABILITY REQUEST:', { propertyId, isPublic, availabilityStatus });
        // Verify property belongs to landlord
        const property = await prisma_1.prisma.property.findFirst({
            where: {
                id: propertyId,
                ownerId: req.userId
            }
        });
        if (!property) {
            return res.status(404).json({ error: 'Property not found or unauthorized' });
        }
        const updateData = {
            isPublic: isPublic !== undefined ? isPublic : property.isPublic,
            availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : property.availabilityStatus
        };
        const updatedProperty = await prisma_1.prisma.property.update({
            where: { id: propertyId },
            data: updateData
        });
        console.log('✅ Property availability updated:', updatedProperty.id);
        res.json({
            message: 'Property availability updated successfully',
            property: updatedProperty
        });
    }
    catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ error: 'Failed to update property availability' });
    }
};
exports.updatePropertyAvailability = updatePropertyAvailability;
const deleteProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
        console.log('🗑️ DELETE PROPERTY REQUEST:', { propertyId, userId });
        // Verify property belongs to the landlord
        const property = await prisma_1.prisma.property.findFirst({
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
        await prisma_1.prisma.payment.deleteMany({
            where: {
                rental: {
                    propertyId
                }
            }
        });
        console.log('✅ Payments deleted');
        // Delete end requests (they reference rental relationships)
        await prisma_1.prisma.endRequest.deleteMany({
            where: {
                rental: {
                    propertyId
                }
            }
        });
        console.log('✅ End requests deleted');
        // Delete messages (they reference property directly)
        await prisma_1.prisma.message.deleteMany({
            where: { propertyId }
        });
        console.log('✅ Messages deleted');
        // Delete payment date change requests (they reference property directly)
        await prisma_1.prisma.paymentDateChangeRequest.deleteMany({
            where: { propertyId }
        });
        console.log('✅ Payment date change requests deleted');
        // Then delete rental relationships  
        await prisma_1.prisma.rentalRelationship.deleteMany({
            where: { propertyId }
        });
        console.log('✅ Rental relationships deleted');
        // Delete any notifications related to this property
        await prisma_1.prisma.notification.deleteMany({
            where: {
                data: {
                    path: ['propertyId'],
                    equals: propertyId
                }
            }
        });
        console.log('✅ Notifications deleted');
        // Finally delete the property
        await prisma_1.prisma.property.delete({
            where: { id: propertyId }
        });
        console.log('✅ Property deleted');
        console.log('✅ Property deleted successfully:', propertyId);
        res.json({
            message: 'Property deleted successfully',
            propertyId
        });
    }
    catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};
exports.deleteProperty = deleteProperty;
// Helper function to send notifications when a property is added to a zone
// TODO: Temporarily commented until DB migration completes
/*
const sendZoneNotifications = async (propertyAddress: string, propertyTitle: string, propertyId: string) => {
  try {
    console.log('🔔 Sending zone notifications for new property:', propertyTitle);
    
    // Extract zone from address (this is a simple approach - you might want to improve it)
    const zones = [
      { key: 'dubai-marina', names: ['Dubai Marina', 'Marina'] },
      { key: 'downtown-dubai', names: ['Downtown Dubai', 'Downtown', 'DIFC'] },
      { key: 'business-bay', names: ['Business Bay'] },
      { key: 'jvc', names: ['Jumeirah Village Circle', 'JVC'] },
      { key: 'al-barsha', names: ['Al Barsha', 'Barsha'] },
      { key: 'palm-jumeirah', names: ['Palm Jumeirah', 'Palm'] },
    ];

    // Find matching zones in the address
    const matchingZones: string[] = [];
    
    zones.forEach(zone => {
      zone.names.forEach(name => {
        if (propertyAddress.toLowerCase().includes(name.toLowerCase())) {
          matchingZones.push(zone.key);
          matchingZones.push(name); // Also add the full name
        }
      });
    });

    if (matchingZones.length === 0) {
      console.log('No matching zones found for address:', propertyAddress);
      return;
    }

    console.log('Found matching zones:', matchingZones);

    // Get users with notifications enabled for these zones
    const interestedUsers = await prisma.zoneNotificationPreference.findMany({
      where: {
        zoneName: { in: matchingZones },
        isEnabled: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            pushToken: true,
            userType: true
          }
        }
      }
    });

    console.log(`Found ${interestedUsers.length} users to notify`);

    // Send notifications to each user
    for (const preference of interestedUsers) {
      if (preference.user.userType === 'TENANT' && preference.user.pushToken) {
        try {
          await NotificationService.createAndSendNotification(
            preference.user.id,
            'NEW_PROPERTY_IN_ZONE',
            `New Property in ${preference.zoneName}`,
            `${propertyTitle} is now available for rent!`,
            {
              type: 'new_property_in_zone',
              propertyId,
              zoneName: preference.zoneName
            }
          );
          console.log(`✅ Sent notification to ${preference.user.name} for zone ${preference.zoneName}`);
        } catch (error) {
          console.error(`❌ Failed to send notification to ${preference.user.name}:`, error);
        }
      }
    }

  } catch (error) {
    console.error('Error in sendZoneNotifications:', error);
    throw error;
  }
};
*/
//# sourceMappingURL=propertyController.js.map