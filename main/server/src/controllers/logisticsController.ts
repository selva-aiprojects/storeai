import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

export interface ShipmentLabel {
  awbNumber: string;
  carrier: string;
  serviceLevel: string;
  estimatedDeliveryDays: number;
  shippingCost: number;
  trackingUrl: string;
  status: string;
}

export const CARRIERS = [
  { id: 'DHL', name: 'DHL Express Global', deliveryDays: 2, rate: 450, icon: '✈️' },
  { id: 'FEDEX', name: 'FedEx Priority International', deliveryDays: 3, rate: 380, icon: '📦' },
  { id: 'ARAMEX', name: 'Aramex Express', deliveryDays: 4, rate: 290, icon: '🚚' },
  { id: 'DELHIVERY', name: 'Delhivery Surface / Express', deliveryDays: 3, rate: 120, icon: '🚛' },
];

export const getCarrierRates = async (req: AuthRequest, res: Response) => {
  const { weightKg = 1, destinationCountry = 'IN' } = req.query;
  const rates = CARRIERS.map(c => ({
    ...c,
    calculatedRate: Math.round(c.rate * Number(weightKg) * (destinationCountry === 'IN' ? 1 : 2.5))
  }));
  res.json(rates);
};

export const createShipmentLabel = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, carrierId = 'FEDEX', recipientAddress } = req.body;

    const carrier = CARRIERS.find(c => c.id === carrierId) || CARRIERS[1];
    const awbNumber = `AWB-${carrier.id}-${Date.now().toString().slice(-6)}`;

    const shipment: ShipmentLabel = {
      awbNumber,
      carrier: carrier.name,
      serviceLevel: 'Express Air Dispatch',
      estimatedDeliveryDays: carrier.deliveryDays,
      shippingCost: carrier.rate,
      trackingUrl: `https://track.storeai.io/${awbNumber}`,
      status: 'LABEL_CREATED_DISPATCH_PENDING'
    };

    res.status(201).json({
      success: true,
      orderId,
      shipment,
      message: `Shipment label generated with ${carrier.name}. AWB: ${awbNumber}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Shipment label generation failed' });
  }
};
