import { useState, useRef } from 'react';
import { Order, Invoice } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    X,
    Download,
    Save,
    Building2,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InvoiceEditorProps {
    order: Order;
    existingInvoice?: Invoice | null;
    onClose: () => void;
    onSave: (invoice: Partial<Invoice>) => void;
}

export function InvoiceEditor({ order, existingInvoice, onClose, onSave }: InvoiceEditorProps) {
    const { currentProject } = useProject();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const gstConfig = currentProject?.gstConfig;
    const gstEnabled = gstConfig?.enabled || false;
    const gstRate = 18; // Default GST rate

    const subtotal = order.totalAmount || 0;
    const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0;
    const grandTotal = subtotal + gstAmount;

    // Type for stored invoice data
    const savedData = (existingInvoice as any)?.invoiceData;

    // Placeholder for totalOrders, as it's not provided in the context.
    // In a real application, this would come from a data source.
    const totalOrders = 0;

    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: existingInvoice?.invoiceNumber || `# INV-${(totalOrders + 1).toString().padStart(6, '0')}`,
        invoiceDate: savedData?.invoiceDate || (existingInvoice?.createdAt ? format(new Date(existingInvoice.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')),
        dueDate: savedData?.dueDate || format(new Date(), 'dd/MM/yyyy'),
        terms: savedData?.terms || 'Due on Receipt',
        notes: savedData?.notes || '',
        // Company details
        companyName: savedData?.companyName || 'Ateliora pvt ltd',
        companyAddress: savedData?.companyAddress || '',
        gstin: savedData?.gstin || '06ABDCA1385R1Z8',
        // Bank Details
        accountNumber: savedData?.accountNumber || '77727009905',
        ifsc: savedData?.ifsc || 'IDFB0021003',
        swiftCode: savedData?.swiftCode || 'IDFBINBBMUM',
        bankName: savedData?.bankName || 'IDFC FIRST',
        // Client details
        clientName: savedData?.clientName || order.createdByName || 'RA ATELIER',
        clientAddress: savedData?.clientAddress || 'BASEMENT, F59, SOUTH CITY 1\nGURUGRAM\n122002 Haryana\nIndia',
        clientGstin: savedData?.clientGstin || '06ABIFR2833F1ZA',
        shipToAddress: savedData?.shipToAddress || 'BASEMENT, F59, SOUTH CITY 1\nGURUGRAM\n122002 Haryana\nIndia',
        placeOfSupply: savedData?.placeOfSupply || 'Haryana (06)',
    });

    const handleGeneratePDF = async () => {
        if (!invoiceRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            toast.loading('Generating PDF...');

            const originalElement = invoiceRef.current;
            const clone = originalElement.cloneNode(true) as HTMLElement;

            const inputs = clone.querySelectorAll('input, textarea');
            inputs.forEach((input) => {
                const value = (input as HTMLInputElement).value;
                const div = document.createElement('div');
                div.textContent = value || (input as HTMLInputElement).placeholder || '';
                div.className = (input as HTMLElement).className;
                div.style.color = '#000000';
                div.style.backgroundColor = 'transparent';
                div.style.border = 'none';
                div.style.padding = '0';
                div.style.whiteSpace = input.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
                div.style.fontSize = window.getComputedStyle(input).fontSize;
                div.style.fontWeight = window.getComputedStyle(input).fontWeight;
                input.parentNode?.replaceChild(div, input);
            });

            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = '794px'; // A4 width at 96 DPI
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                // @ts-ignore - scale is valid but sometimes missing from types
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: clone.scrollWidth,
                height: clone.scrollHeight,
                windowWidth: clone.scrollWidth,
                windowHeight: clone.scrollHeight,
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if the content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${invoiceData.invoiceNumber}.pdf`);

            toast.dismiss();
            toast.success('PDF downloaded successfully');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to generate PDF');
            console.error('PDF generation error:', error);
        }
    };

    const handleSave = () => {
        const invoice: Partial<Invoice> & { invoiceData?: typeof invoiceData } = {
            id: existingInvoice?.id || `inv-${Date.now()}`,
            orderId: order.id,
            projectId: order.projectId,
            invoiceNumber: invoiceData.invoiceNumber,
            amount: subtotal,
            gstAmount: gstAmount,
            totalAmount: grandTotal,
            status: 'pending',
            createdAt: existingInvoice?.createdAt || new Date(),
            invoiceData: invoiceData,
        };
        onSave(invoice);
        toast.success('Invoice saved successfully');
    };

    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
                {/* Header Toolbar */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Tax Invoice Editor</h2>
                            <p className="text-xs text-muted-foreground">{invoiceData.invoiceNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="gap-2">
                            <Download className="w-4 h-4" /> PDF
                        </Button>
                        <Button size="sm" onClick={handleSave} className="gap-2 bg-black text-white hover:bg-black/80">
                            <Save className="w-4 h-4" /> Save
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-100">
                    <div className="p-8 flex justify-center">
                        {/* Invoice Paper Clone */}
                        <div
                            ref={invoiceRef}
                            className="bg-white text-black shadow-2xl p-12 w-full max-w-[800px] min-h-[1100px] flex flex-col font-sans"
                            style={{ color: '#000' }}
                        >
                            {/* Page 1 Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h1 className="text-7xl font-serif italic mb-2 tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>Ateli</h1>
                                    <Input
                                        value={invoiceData.companyName}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                                        className="text-lg font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black mb-1 w-full"
                                    />
                                </div>
                                <div className="text-right">
                                    <h2 className="text-5xl font-black tracking-tighter mb-2 text-[#111]">TAX INVOICE</h2>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">#</span>
                                            <Input
                                                value={invoiceData.invoiceNumber}
                                                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                                                className="w-48 text-right font-black border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black text-base"
                                            />
                                        </div>
                                        <div className="mt-8">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Balance Due</p>
                                            <p className="text-4xl font-black">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses Section */}
                            <div className="grid grid-cols-2 gap-12 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-2">Bill To</p>
                                    <div className="space-y-0.5">
                                        <Input
                                            value={invoiceData.clientName}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                                            className="text-sm font-black border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black"
                                        />
                                        <Textarea
                                            value={invoiceData.clientAddress}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                                            className="text-xs border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black resize-none min-h-[80px]"
                                        />
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-gray-500">GSTIN</span>
                                            <Input
                                                value={invoiceData.clientGstin}
                                                onChange={(e) => setInvoiceData({ ...invoiceData, clientGstin: e.target.value })}
                                                className="text-xs font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-xs font-bold text-gray-400 mb-2">Ship To</p>
                                        <Textarea
                                            value={invoiceData.shipToAddress}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, shipToAddress: e.target.value })}
                                            className="text-xs border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black resize-none min-h-[80px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500 font-bold">Invoice Date :</span>
                                        <Input
                                            value={invoiceData.invoiceDate}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                                            className="w-32 text-right border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black text-xs"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500 font-bold">Terms :</span>
                                        <Input
                                            value={invoiceData.terms}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                                            className="w-32 text-right border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black text-xs"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500 font-bold">Due Date :</span>
                                        <Input
                                            value={invoiceData.dueDate}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                                            className="w-32 text-right border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 flex items-center gap-2 text-xs">
                                <span className="text-gray-500 font-bold">Place Of Supply:</span>
                                <Input
                                    value={invoiceData.placeOfSupply}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, placeOfSupply: e.target.value })}
                                    className="border-none p-0 h-auto bg-transparent focus-visible:ring-0 text-black text-xs flex-1"
                                />
                            </div>

                            {/* Main Table */}
                            <div className="flex-1">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-[#c87a38] text-white">
                                            <th className="py-2.5 px-2 text-left w-8">#</th>
                                            <th className="py-2.5 px-2 text-left">Item & Description</th>
                                            <th className="py-2.5 px-2 text-center">HSN/SAC</th>
                                            <th className="py-2.5 px-2 text-right">Qty</th>
                                            <th className="py-2.5 px-2 text-right">Rate</th>
                                            <th className="py-2.5 px-2 text-center">CGST</th>
                                            <th className="py-2.5 px-2 text-center">SGST</th>
                                            <th className="py-2.5 px-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {order.items.map((item, idx) => {
                                            const itemTax = (item.totalPrice * 0.18); // Assuming 18% GST for each item
                                            return (
                                                <tr key={item.id} className="align-top">
                                                    <td className="py-4 px-2">{idx + 1}</td>
                                                    <td className="py-4 px-2 font-bold max-w-[200px]">
                                                        {item.name}
                                                        {item.description && <p className="text-[10px] text-gray-500 font-normal mt-0.5">{item.description}</p>}
                                                    </td>
                                                    <td className="py-4 px-2 text-center">44111200</td> {/* Placeholder HSN/SAC */}
                                                    <td className="py-4 px-2 text-right">
                                                        {item.quantity.toFixed(2)}
                                                        <span className="block text-[9px] text-gray-500">PCS</span>
                                                    </td>
                                                    <td className="py-4 px-2 text-right">{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    <td className="py-4 px-2 text-center">
                                                        {(itemTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        <span className="block text-[9px] text-gray-500">9%</span>
                                                    </td>
                                                    <td className="py-4 px-2 text-center">
                                                        {(itemTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        <span className="block text-[9px] text-gray-500">9%</span>
                                                    </td>
                                                    <td className="py-4 px-2 text-right font-bold">{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Electronic Generation Notice */}
                            <div className="mt-8 pt-4 border-t border-black flex justify-between items-center text-[10px] italic">
                                <span>This is an electronically generated invoice, no signature is required</span>
                                <span>1</span>
                            </div>

                            {/* Summary & Bank Info Footer */}
                            <div className="mt-12 pt-12 border-t-2 border-dashed border-gray-200 grid grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-4">Thanks for your business.</p>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex gap-2 font-bold">
                                                <span className="w-32 text-gray-400">Company Name:</span>
                                                <Input
                                                    value={invoiceData.companyName}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-32 text-gray-400">GST Number:</span>
                                                <Input
                                                    value={invoiceData.gstin}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, gstin: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-32 text-gray-400">Account Number:</span>
                                                <Input
                                                    value={invoiceData.accountNumber}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, accountNumber: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-32 text-gray-400">IFSC:</span>
                                                <Input
                                                    value={invoiceData.ifsc}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, ifsc: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-32 text-gray-400">SWIFT Code:</span>
                                                <Input
                                                    value={invoiceData.swiftCode}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, swiftCode: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-32 text-gray-400">Bank Name:</span>
                                                <Input
                                                    value={invoiceData.bankName}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, bankName: e.target.value })}
                                                    className="p-0 border-none h-auto bg-transparent focus-visible:ring-0 text-black text-xs font-bold w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                            {/* Placeholder for QR - User should place upi-qr.png in public/assets/ */}
                                            <div className="w-24 h-24 flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 text-center font-bold">
                                                <img
                                                    src="/assets/upi-qr.png"
                                                    alt="UPI QR"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                        (e.target as HTMLElement).parentElement!.innerHTML = 'QR CODE';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-sm font-black text-gray-700 leading-tight">UPI NOW</p>
                                            <p className="text-xl font-black text-gray-700 leading-tight">!</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2 underline decoration-dashed">Terms & Conditions</p>
                                        <ul className="text-[9px] list-disc ml-4 space-y-1 text-gray-600">
                                            <li>Please check your order at the time of delivery.</li>
                                            <li>Raise any concerns immediately so we can help.</li>
                                            <li>After acceptance on site, returns, exchanges, or refunds cannot be processed.</li>
                                            <li>A delivery confirmation message will be treated as final acceptance.</li>
                                            <li>Ateli is a delivery facilitator; product warranty/quality rest with manufacturer.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs pt-4">
                                        <span className="text-gray-500 font-bold">Sub Total</span>
                                        <span className="font-bold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold flex flex-col">
                                            Shipping charge
                                            <span className="text-[9px] font-normal">(GST18 (18%) )</span>
                                            <span className="text-[9px] font-normal italic">SAC: 996511</span>
                                        </span>
                                        <span className="font-bold">₹0.00</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold">CGST9 (9%)</span>
                                        <span className="font-bold">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold">SGST9 (9%)</span>
                                        <span className="font-bold">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold">Rounding</span>
                                        <span className="font-bold">0.00</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2 mt-4">
                                        <span>Total</span>
                                        <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-destructive italic">
                                        <span>Payment Made</span>
                                        <span>(-) ₹0.00</span>
                                    </div>
                                    <div className="bg-[#e9b177] p-2.5 flex justify-between items-center mt-4">
                                        <span className="text-xs font-bold uppercase">Balance Due</span>
                                        <span className="text-lg font-bold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pt-4 text-[10px] text-right">
                                        <span className="text-gray-400 font-bold italic">Total In Words:</span>
                                        <p className="font-black italic mt-1 leading-tight">
                                            {/* In a real app we'd use a number-to-words library */}
                                            Indian Rupee {grandTotal.toLocaleString('en-IN')} Only
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
