/**
 * ESC/POS Direct Thermal Printer Utility & Receipt Formatter
 * Supports 58mm (2-inch) and 80mm (3-inch) Thermal Receipt formatting,
 * ESC/POS raw command generation, and Direct WebUSB/WebSerial interface.
 */

export interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
    gstPercentage: number;
    batchNumber?: string;
    mrp?: number;
}

export interface ReceiptData {
    invoiceNo: string;
    date: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeGstin: string;
    cashierName: string;
    salespersonName?: string;
    customerName?: string;
    customerPhone?: string;
    items: ReceiptItem[];
    subtotal: number;
    cgst: number;
    sgst: number;
    discount: number;
    deliveryCharge?: number;
    totalAmount: number;
    paymentMethod: string;
    tenderedAmount?: number;
    changeAmount?: number;
    upiId?: string;
    paperWidth?: '58mm' | '80mm';
}

/**
 * Generates an ASCII formatted thermal receipt layout suitable for direct printing
 */
export function generateThermalReceiptText(data: ReceiptData): string {
    const width = data.paperWidth === '58mm' ? 32 : 44;
    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);

    const padCenter = (str: string) => {
        const space = Math.max(0, width - str.length);
        const left = Math.floor(space / 2);
        return ' '.repeat(left) + str;
    };

    const padRow = (left: string, right: string) => {
        const space = Math.max(1, width - left.length - right.length);
        return left + ' '.repeat(space) + right;
    };

    let text = '';
    text += padCenter(data.storeName.toUpperCase()) + '\n';
    text += padCenter(data.storeAddress) + '\n';
    text += padCenter(`Phone: ${data.storePhone}`) + '\n';
    text += padCenter(`GSTIN: ${data.storeGstin}`) + '\n';
    text += doubleDivider + '\n';
    text += padCenter('TAX INVOICE') + '\n';
    text += doubleDivider + '\n';
    text += padRow(`Inv: ${data.invoiceNo}`, `Date: ${data.date}`) + '\n';
    text += padRow(`Cashier: ${data.cashierName}`, data.salespersonName ? `Sales: ${data.salespersonName}` : '') + '\n';
    if (data.customerName) {
        text += padRow(`Customer: ${data.customerName}`, data.customerPhone || '') + '\n';
    }
    text += divider + '\n';

    if (data.paperWidth === '58mm') {
        text += padRow('Item (Qty x Price)', 'Total') + '\n';
        text += divider + '\n';
        data.items.forEach(item => {
            text += `${item.name.substring(0, width)}\n`;
            const sub = `${item.quantity} x ₹${item.price.toFixed(2)}`;
            const total = `₹${(item.quantity * item.price).toFixed(2)}`;
            text += padRow(`  ${sub}`, total) + '\n';
        });
    } else {
        // 80mm table layout
        text += 'Item                      Qty   Price    Total\n';
        text += divider + '\n';
        data.items.forEach(item => {
            const name = item.name.length > 22 ? item.name.substring(0, 20) + '..' : item.name.padEnd(22);
            const qty = item.quantity.toString().padStart(4);
            const price = item.price.toFixed(0).padStart(7);
            const total = (item.quantity * item.price).toFixed(2).padStart(8);
            text += `${name} ${qty} ${price} ${total}\n`;
        });
    }

    text += divider + '\n';
    text += padRow('Subtotal (Excl Tax):', `₹${data.subtotal.toFixed(2)}`) + '\n';
    text += padRow('CGST:', `₹${data.cgst.toFixed(2)}`) + '\n';
    text += padRow('SGST:', `₹${data.sgst.toFixed(2)}`) + '\n';
    if (data.discount > 0) {
        text += padRow('Discount:', `-₹${data.discount.toFixed(2)}`) + '\n';
    }
    if (data.deliveryCharge && data.deliveryCharge > 0) {
        text += padRow('Delivery Charge:', `₹${data.deliveryCharge.toFixed(2)}`) + '\n';
    }
    text += doubleDivider + '\n';
    text += padRow('GRAND TOTAL:', `₹${data.totalAmount.toFixed(2)}`) + '\n';
    text += doubleDivider + '\n';
    text += padRow(`Payment Mode:`, data.paymentMethod) + '\n';
    if (data.tenderedAmount && data.tenderedAmount > 0) {
        text += padRow('Cash Received:', `₹${data.tenderedAmount.toFixed(2)}`) + '\n';
        text += padRow('Change Returned:', `₹${(data.changeAmount || 0).toFixed(2)}`) + '\n';
    }

    text += '\n' + padCenter('*** THANK YOU FOR SHOPPING! ***') + '\n';
    text += padCenter('Goods once sold can be exchanged in 7 days.') + '\n';
    text += padCenter('Powered by StoreAI Unified Commerce') + '\n';
    text += '\n\n\n'; // Feed lines for paper tear off

    return text;
}

/**
 * Generates raw ESC/POS binary buffer commands for USB/Bluetooth thermal printer
 */
export function generateEscPosBytes(data: ReceiptData): Uint8Array {
    const encoder = new TextEncoder();
    const text = generateThermalReceiptText(data);

    // ESC/POS Commands
    const ESC = 0x1B;
    const GS = 0x1D;

    const initPrinter = [ESC, 0x40]; // ESC @ - Initialize
    const alignCenter = [ESC, 0x61, 0x01]; // ESC a 1 - Center Align
    const alignLeft = [ESC, 0x61, 0x00]; // ESC a 0 - Left Align
    const cutPaper = [GS, 0x56, 0x41, 0x00]; // GS V A 0 - Full Cut

    const textBytes = encoder.encode(text);
    const totalLength = initPrinter.length + textBytes.length + cutPaper.length;

    const buffer = new Uint8Array(totalLength);
    let offset = 0;

    buffer.set(initPrinter, offset);
    offset += initPrinter.length;

    buffer.set(textBytes, offset);
    offset += textBytes.length;

    buffer.set(cutPaper, offset);

    return buffer;
}

/**
 * Triggers native browser receipt popup print dialog
 */
export function printReceiptInBrowser(data: ReceiptData) {
    const formattedText = generateThermalReceiptText(data);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - ${data.invoiceNo}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: ${data.paperWidth === '58mm' ? '12px' : '13px'};
                        line-height: 1.25;
                        padding: 10px;
                        margin: 0;
                        white-space: pre-wrap;
                        background: #fff;
                        color: #000;
                    }
                    @media print {
                        @page { margin: 0; size: auto; }
                        body { margin: 5mm; }
                    }
                </style>
            </head>
            <body>
${formattedText}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}
