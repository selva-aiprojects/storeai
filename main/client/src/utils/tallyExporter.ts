/**
 * Tally Prime & Tally.ERP 9 XML Data Exporter
 * Generates official Tally XML standard vouchers for 1-click accounting import.
 */

export interface TallyVoucherSale {
    invoiceNo: string;
    date: string; // YYYYMMDD or YYYY-MM-DD
    customerName: string;
    totalAmount: number;
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount?: number;
    paymentMethod: string;
    items?: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
    }>;
}

export function generateTallySalesXml(sales: TallyVoucherSale[], companyName: string = 'StoreAI Retail'): string {
    const formatDateForTally = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '20260401';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ENVELOPE>\n`;
    xml += `  <HEADER>\n`;
    xml += `    <TALLYREQUEST>Import Data</TALLYREQUEST>\n`;
    xml += `  </HEADER>\n`;
    xml += `  <BODY>\n`;
    xml += `    <IMPORTDATA>\n`;
    xml += `      <REQUESTDESC>\n`;
    xml += `        <REPORTNAME>Vouchers</REPORTNAME>\n`;
    xml += `        <STATICVARIABLES>\n`;
    xml += `          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>\n`;
    xml += `        </STATICVARIABLES>\n`;
    xml += `      </REQUESTDESC>\n`;
    xml += `      <REQUESTDATA>\n`;

    sales.forEach(sale => {
        const tallyDate = formatDateForTally(sale.date);
        const partyLedger = sale.customerName && sale.customerName !== 'Walk-in Customer' ? escapeXml(sale.customerName) : 'Cash-in-Hand';

        xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
        xml += `          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">\n`;
        xml += `            <DATE>${tallyDate}</DATE>\n`;
        xml += `            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n`;
        xml += `            <VOUCHERNUMBER>${escapeXml(sale.invoiceNo)}</VOUCHERNUMBER>\n`;
        xml += `            <PARTYLEDGERNAME>${partyLedger}</PARTYLEDGERNAME>\n`;
        xml += `            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>\n`;
        xml += `            <ISINVOICE>Yes</ISINVOICE>\n`;
        
        // Party Debit Ledger
        xml += `            <ALLLEDGERENTRIES.LIST>\n`;
        xml += `              <LEDGERNAME>${partyLedger}</LEDGERNAME>\n`;
        xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
        xml += `              <AMOUNT>-${sale.totalAmount.toFixed(2)}</AMOUNT>\n`;
        xml += `            </ALLLEDGERENTRIES.LIST>\n`;

        // Sales Revenue Credit Ledger
        xml += `            <ALLLEDGERENTRIES.LIST>\n`;
        xml += `              <LEDGERNAME>Sales Account</LEDGERNAME>\n`;
        xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
        xml += `              <AMOUNT>${sale.subtotal.toFixed(2)}</AMOUNT>\n`;
        xml += `            </ALLLEDGERENTRIES.LIST>\n`;

        // CGST Credit Ledger
        if (sale.cgstAmount > 0) {
            xml += `            <ALLLEDGERENTRIES.LIST>\n`;
            xml += `              <LEDGERNAME>CGST Output Tax</LEDGERNAME>\n`;
            xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
            xml += `              <AMOUNT>${sale.cgstAmount.toFixed(2)}</AMOUNT>\n`;
            xml += `            </ALLLEDGERENTRIES.LIST>\n`;
        }

        // SGST Credit Ledger
        if (sale.sgstAmount > 0) {
            xml += `            <ALLLEDGERENTRIES.LIST>\n`;
            xml += `              <LEDGERNAME>SGST Output Tax</LEDGERNAME>\n`;
            xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
            xml += `              <AMOUNT>${sale.sgstAmount.toFixed(2)}</AMOUNT>\n`;
            xml += `            </ALLLEDGERENTRIES.LIST>\n`;
        }

        // IGST Credit Ledger
        if (sale.igstAmount && sale.igstAmount > 0) {
            xml += `            <ALLLEDGERENTRIES.LIST>\n`;
            xml += `              <LEDGERNAME>IGST Output Tax</LEDGERNAME>\n`;
            xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
            xml += `              <AMOUNT>${sale.igstAmount.toFixed(2)}</AMOUNT>\n`;
            xml += `            </ALLLEDGERENTRIES.LIST>\n`;
        }

        xml += `          </VOUCHER>\n`;
        xml += `        </TALLYMESSAGE>\n`;
    });

    xml += `      </REQUESTDATA>\n`;
    xml += `    </IMPORTDATA>\n`;
    xml += `  </BODY>\n`;
    xml += `</ENVELOPE>\n`;

    return xml;
}

function escapeXml(unsafe: string): string {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function downloadTallyXmlFile(sales: TallyVoucherSale[], filename: string = 'Tally_Sales_Import.xml') {
    const xmlContent = generateTallySalesXml(sales);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
