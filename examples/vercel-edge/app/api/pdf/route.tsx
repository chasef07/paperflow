/**
 * Vercel Edge Runtime PDF Generation Example
 *
 * This demonstrates PaperFlow running on Vercel's Edge Runtime.
 * Deploy to Vercel and hit /api/pdf to generate a PDF.
 */

import { render, Document, Page, View, Text } from 'paperflow';

// Run on Edge Runtime
export const runtime = 'edge';

// Invoice component
const Invoice = ({ invoiceNumber, date }: { invoiceNumber: string; date: string }) => (
  <Document title={`Invoice ${invoiceNumber}`} author="PaperFlow Demo">
    <Page size="A4" margin={50}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>INVOICE</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>#{invoiceNumber}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Date</Text>
          <Text style={{ fontSize: 16, fontWeight: 500 }}>{date}</Text>
        </View>
      </View>

      {/* Company Info */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
        <View>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>FROM</Text>
          <Text style={{ fontSize: 16, fontWeight: 600 }}>Acme Corporation</Text>
          <Text style={{ fontSize: 14, color: '#4b5563' }}>123 Business Street</Text>
          <Text style={{ fontSize: 14, color: '#4b5563' }}>San Francisco, CA 94102</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>BILL TO</Text>
          <Text style={{ fontSize: 16, fontWeight: 600 }}>John Smith</Text>
          <Text style={{ fontSize: 14, color: '#4b5563' }}>456 Customer Lane</Text>
          <Text style={{ fontSize: 14, color: '#4b5563' }}>Los Angeles, CA 90001</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={{ marginBottom: 40 }}>
        {/* Table Header */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#f3f4f6',
          padding: 12,
          borderRadius: 4,
        }}>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#374151' }}>ITEM</Text>
          <Text style={{ width: 80, fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'center' }}>QTY</Text>
          <Text style={{ width: 100, fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'right' }}>PRICE</Text>
          <Text style={{ width: 100, fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'right' }}>TOTAL</Text>
        </View>

        {/* Table Rows */}
        <View style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <Text style={{ flex: 1, fontSize: 14 }}>Professional Services</Text>
          <Text style={{ width: 80, fontSize: 14, textAlign: 'center' }}>10</Text>
          <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>$150.00</Text>
          <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>$1,500.00</Text>
        </View>
        <View style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <Text style={{ flex: 1, fontSize: 14 }}>Software License</Text>
          <Text style={{ width: 80, fontSize: 14, textAlign: 'center' }}>5</Text>
          <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>$99.00</Text>
          <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>$495.00</Text>
        </View>
      </View>

      {/* Totals */}
      <View style={{ alignItems: 'flex-end' }}>
        <View style={{ width: 250 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Subtotal</Text>
            <Text style={{ fontSize: 14 }}>$1,995.00</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Tax (10%)</Text>
            <Text style={{ fontSize: 14 }}>$199.50</Text>
          </View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTopWidth: 2,
            borderTopColor: '#111827',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>$2,194.50</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: 'auto', paddingTop: 40 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Thank you for your business!
        </Text>
        <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          Generated with PaperFlow on Vercel Edge Runtime
        </Text>
      </View>
    </Page>
  </Document>
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceNumber = searchParams.get('invoice') || 'INV-2024-001';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const result = await render(
      <Invoice invoiceNumber={invoiceNumber} date={date} />
    );

    return new Response(result.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
