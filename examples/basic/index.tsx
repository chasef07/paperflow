/**
 * PaperFlow Basic Example
 *
 * Demonstrates creating a PDF invoice using PaperFlow components.
 */

import {
  render,
  Document,
  Page,
  View,
  Text,
  Image,
  PageSizes,
  PaperFlowError,
} from 'paperflow';

// =============================================================================
// Invoice Component
// =============================================================================

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceProps {
  invoiceNumber: string;
  date: string;
  company: {
    name: string;
    address: string;
    city: string;
  };
  customer: {
    name: string;
    address: string;
    city: string;
  };
  items: InvoiceItem[];
}

const Invoice = ({ invoiceNumber, date, company, customer, items }: InvoiceProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <Document title={`Invoice ${invoiceNumber}`} author={company.name}>
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

        {/* Company and Customer Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
          <View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>FROM</Text>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>{company.name}</Text>
            <Text style={{ fontSize: 14, color: '#4b5563' }}>{company.address}</Text>
            <Text style={{ fontSize: 14, color: '#4b5563' }}>{company.city}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>BILL TO</Text>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>{customer.name}</Text>
            <Text style={{ fontSize: 14, color: '#4b5563' }}>{customer.address}</Text>
            <Text style={{ fontSize: 14, color: '#4b5563' }}>{customer.city}</Text>
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
          {items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}
            >
              <Text style={{ flex: 1, fontSize: 14 }}>{item.name}</Text>
              <Text style={{ width: 80, fontSize: 14, textAlign: 'center' }}>{item.quantity}</Text>
              <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>${item.price.toFixed(2)}</Text>
              <Text style={{ width: 100, fontSize: 14, textAlign: 'right' }}>${(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ width: 250 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Subtotal</Text>
              <Text style={{ fontSize: 14 }}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Tax (10%)</Text>
              <Text style={{ fontSize: 14 }}>${tax.toFixed(2)}</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTopWidth: 2,
              borderTopColor: '#111827',
            }}>
              <Text style={{ fontSize: 18, fontWeight: 700 }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: 700 }}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 'auto', paddingTop: 40 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
            Thank you for your business!
          </Text>
          <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
            Generated with PaperFlow
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// =============================================================================
// Simple Test Component
// =============================================================================

const SimpleTest = () => (
  <Document title="Simple Test">
    <Page size="A4" margin={40}>
      <Text style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        Hello, PaperFlow!
      </Text>
      <Text style={{ fontSize: 16, color: '#4b5563', marginBottom: 20 }}>
        This is a simple test document to verify the PDF generation works correctly.
      </Text>
      <View style={{
        backgroundColor: '#f3f4f6',
        padding: 20,
        borderRadius: 8,
      }}>
        <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Features:</Text>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>• React components</Text>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>• Tailwind-like styling</Text>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>• Auto font loading from CDN</Text>
        <Text style={{ fontSize: 14, color: '#4b5563' }}>• Works on Vercel, Cloudflare, Bun</Text>
      </View>
    </Page>
  </Document>
);

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('🚀 PaperFlow Example\n');

  // Test 1: Simple document
  console.log('--- Test 1: Simple Document ---');
  try {
    const startTime = Date.now();
    const result = await render(<SimpleTest />);
    const duration = Date.now() - startTime;

    console.log(`✓ Rendered simple document`);
    console.log(`  Pages: ${result.pages}`);
    console.log(`  Size: ${(result.buffer.length / 1024).toFixed(1)} KB`);
    console.log(`  Time: ${duration}ms`);

    await result.toFile('simple-test.pdf');
    console.log(`  Saved to: simple-test.pdf\n`);
  } catch (error) {
    if (error instanceof PaperFlowError) {
      console.error('✗ Error:', error.toString());
    } else {
      throw error;
    }
  }

  // Test 2: Invoice
  console.log('--- Test 2: Invoice ---');
  try {
    const invoiceData: InvoiceProps = {
      invoiceNumber: 'INV-2024-001',
      date: 'December 6, 2024',
      company: {
        name: 'Acme Corporation',
        address: '123 Business Street',
        city: 'San Francisco, CA 94102',
      },
      customer: {
        name: 'John Smith',
        address: '456 Customer Lane',
        city: 'Los Angeles, CA 90001',
      },
      items: [
        { name: 'Professional Services', quantity: 10, price: 150 },
        { name: 'Software License', quantity: 5, price: 99 },
        { name: 'Support Package', quantity: 1, price: 299 },
      ],
    };

    const startTime = Date.now();
    const result = await render(<Invoice {...invoiceData} />);
    const duration = Date.now() - startTime;

    console.log(`✓ Rendered invoice`);
    console.log(`  Pages: ${result.pages}`);
    console.log(`  Size: ${(result.buffer.length / 1024).toFixed(1)} KB`);
    console.log(`  Time: ${duration}ms`);
    console.log(`  Title: ${result.metadata.title}`);

    await result.toFile('invoice.pdf');
    console.log(`  Saved to: invoice.pdf\n`);
  } catch (error) {
    if (error instanceof PaperFlowError) {
      console.error('✗ Error:', error.toString());
    } else {
      throw error;
    }
  }

  console.log('✅ All tests completed!\n');
}

main().catch(console.error);
