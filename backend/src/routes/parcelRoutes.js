const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcelController');
const validate = require('../middleware/validate');
const { parcelInputSchema, batchParcelInputSchema } = require('../validators/parcelValidator');

// Route a single parcel with payload validation middleware
router.post('/route', validate(parcelInputSchema), parcelController.routeSingleParcel);

// Route a batch of parcels (upload) with payload validation middleware
router.post('/batch', validate(batchParcelInputSchema), parcelController.routeBatchParcels);

// Fetch dashboard KPIs
router.get('/stats', parcelController.getDashboardStats);

// Get parcels list, optionally filtered
router.get('/', parcelController.getParcels);

// Get system routing error logs
router.get('/errors', parcelController.getErrors);

// Reset dashboard stats to zero (wipes all records)
router.post('/reset', parcelController.resetStats);

module.exports = router;
