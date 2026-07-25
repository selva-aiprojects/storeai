import { Router } from 'express';
import { getCarrierRates, createShipmentLabel } from '../controllers/logisticsController';

const router = Router();
router.get('/rates', getCarrierRates);
router.post('/shipment', createShipmentLabel);

export default router;
