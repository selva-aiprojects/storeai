/**
 * Offline-First Transaction Store & Sync Engine for StoreAI POS
 * Ensures 100% operational uptime at checkout counters during network outages.
 */

import { createSale } from './api';

export interface OfflineTransaction {
    offlineId: string;
    saleData: any;
    timestamp: string;
    retryCount: number;
    status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
    errorMessage?: string;
}

const OFFLINE_QUEUE_KEY = 'storeai_pos_offline_queue';

export function getOfflineQueue(): OfflineTransaction[] {
    try {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveOfflineQueue(queue: OfflineTransaction[]): void {
    try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save offline queue to localStorage', e);
    }
}

export function enqueueOfflineSale(saleData: any): OfflineTransaction {
    const queue = getOfflineQueue();
    const offlineId = `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTx: OfflineTransaction = {
        offlineId,
        saleData: {
            ...saleData,
            invoiceNo: saleData.invoiceNo || `INV-OFF-${Date.now().toString().slice(-6)}`
        },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'QUEUED'
    };

    queue.push(newTx);
    saveOfflineQueue(queue);
    return newTx;
}

export async function syncOfflineTransactions(onProgress?: (synced: number, total: number) => void): Promise<{ success: number; failed: number }> {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineTransaction[] = [];

    for (let i = 0; i < queue.length; i++) {
        const tx = queue[i];
        try {
            await createSale(tx.saleData);
            successCount++;
            if (onProgress) onProgress(successCount, queue.length);
        } catch (err: any) {
            console.warn(`Failed to sync offline transaction ${tx.offlineId}`, err);
            tx.retryCount += 1;
            tx.status = 'FAILED';
            tx.errorMessage = err?.message || 'Sync failed';
            remainingQueue.push(tx);
            failedCount++;
        }
    }

    saveOfflineQueue(remainingQueue);
    return { success: successCount, failed: failedCount };
}

export function clearOfflineQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
